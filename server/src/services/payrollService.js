const pool = require('../config/db');
function getWorkingDays(startDate, endDate) {
  let count = 0;
  let curDate = new Date(startDate);
  const end = new Date(endDate);
  while (curDate <= end) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // exclude Sunday(0) and Saturday(6)
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
}

const generatePayslipsForPayrun = async (payrunId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get Payrun details
    const [payruns] = await connection.query('SELECT * FROM payruns WHERE id = ?', [payrunId]);
    if (payruns.length === 0) throw new Error('Payrun not found');
    const payrun = payruns[0];

    const periodStart = new Date(payrun.period_start);
    const periodEnd = new Date(payrun.period_end);
    
    // Formatting pay period string: "01 Oct To 31 Oct"
    const options = { day: '2-digit', month: 'short' };
    const payPeriodStr = `${periodStart.toLocaleDateString('en-GB', options)} To ${periodEnd.toLocaleDateString('en-GB', options)}`;

    const totalWorkingDays = getWorkingDays(periodStart, periodEnd) || 22; // fallback to 22 if 0

    // 2. Get active employees
    const [employees] = await connection.query(
      `SELECT e.id, u.is_active 
       FROM employees e 
       JOIN users u ON e.user_id = u.id 
       WHERE u.is_active = TRUE`
    );

    let generatedCount = 0;

    for (const emp of employees) {
      // 3. Get Salary Structure
      const [structures] = await connection.query(
        `SELECT * FROM salary_structures WHERE employee_id = ? AND effective_from <= ? ORDER BY effective_from DESC LIMIT 1`,
        [emp.id, payrun.period_end]
      );

      if (structures.length === 0) continue; // Skip employees without a salary structure
      const structure = structures[0];

      // 4. Calculate Absences & Unpaid Leaves
      const [absences] = await connection.query(
        `SELECT COUNT(DISTINCT date) as days_absent 
         FROM attendances 
         WHERE employee_id = ? AND date >= ? AND date <= ? AND status = 'ABSENT'`,
        [emp.id, payrun.period_start, payrun.period_end]
      );
      const absentDays = absences[0].days_absent;

      const [unpaidLeaves] = await connection.query(
        `SELECT r.start_date, r.end_date 
         FROM time_off_requests r
         JOIN time_off_types t ON r.time_off_type_id = t.id
         WHERE r.employee_id = ? AND r.status = 'APPROVED' 
         AND r.start_date <= ? AND r.end_date >= ? AND t.is_paid = FALSE`,
        [emp.id, payrun.period_end, payrun.period_start]
      );

      let unpaidLeaveDays = 0;
      for (const leave of unpaidLeaves) {
        const lStart = new Date(leave.start_date) > periodStart ? new Date(leave.start_date) : periodStart;
        const lEnd = new Date(leave.end_date) < periodEnd ? new Date(leave.end_date) : periodEnd;
        if (lStart <= lEnd) {
          unpaidLeaveDays += getWorkingDays(lStart, lEnd);
        }
      }

      // 5. Paid Leaves (for tracking/hourly)
      const [paidLeaves] = await connection.query(
        `SELECT r.start_date, r.end_date 
         FROM time_off_requests r
         JOIN time_off_types t ON r.time_off_type_id = t.id
         WHERE r.employee_id = ? AND r.status = 'APPROVED' 
         AND r.start_date <= ? AND r.end_date >= ? AND t.is_paid = TRUE`,
        [emp.id, payrun.period_end, payrun.period_start]
      );

      let paidLeaveDays = 0;
      for (const leave of paidLeaves) {
        const lStart = new Date(leave.start_date) > periodStart ? new Date(leave.start_date) : periodStart;
        const lEnd = new Date(leave.end_date) < periodEnd ? new Date(leave.end_date) : periodEnd;
        if (lStart <= lEnd) {
          paidLeaveDays += getWorkingDays(lStart, lEnd);
        }
      }

      // 6. Computations
      let payableDays = 0;
      let attendanceDays = 0; // For logging

      if (structure.wage_type === 'MONTHLY') {
        // For salaried employees, assume full month minus explicitly recorded absences or unpaid leaves
        payableDays = totalWorkingDays - unpaidLeaveDays - absentDays;
        if (payableDays < 0) payableDays = 0;
        attendanceDays = payableDays - paidLeaveDays; // roughly
        if (attendanceDays < 0) attendanceDays = 0;
      } else {
        // For hourly, rely strictly on explicit check-ins
        const [att] = await connection.query(
          `SELECT COUNT(DISTINCT date) as days_present 
           FROM attendances 
           WHERE employee_id = ? AND date >= ? AND date <= ? AND status IN ('PRESENT', 'HALF_DAY')`,
          [emp.id, payrun.period_start, payrun.period_end]
        );
        attendanceDays = att[0].days_present;
        payableDays = attendanceDays + paidLeaveDays;
      }
      const dailyRate = structure.monthly_wage / totalWorkingDays;
      
      // Prevent gross wage from exceeding monthly wage if they over-worked somehow without overtime rules
      const calculatedGross = dailyRate * payableDays;
      const grossWage = calculatedGross > structure.monthly_wage ? structure.monthly_wage : calculatedGross;

      // Components as % of Gross
      const basicSalary = grossWage * (structure.basic_pct / 100);
      const hra = basicSalary * (structure.hra_pct / 100);
      
      // For fixed allowances, if they didn't work full month, we should probably pro-rate them.
      // But spec says "Calculate each salary component as % of gross" or "fixed amount". 
      // If it's fixed amount, let's pro-rate by (payableDays/totalWorkingDays).
      const ratio = payableDays / totalWorkingDays;
      const standardAllowance = structure.standard_allowance * ratio;
      const performanceBonus = structure.performance_bonus * ratio;
      const travelAllowance = structure.travel_allowance * ratio;
      const foodAllowance = structure.food_allowance * ratio;

      // Deductions
      const pfEmployee = basicSalary * (Number(structure.pf_pct) / 100);
      const pfEmployer = basicSalary * (Number(structure.pf_pct) / 100);
      const professionalTax = payableDays > 0 ? Number(structure.professional_tax) : 0; // Don't deduct if didn't work at all
      
      const totalDeductions = pfEmployee + professionalTax;
      const netPayable = grossWage - totalDeductions;

      // 7. Insert Payslip
      // Check if payslip already exists for this run and employee
      const [existing] = await connection.query(
        'SELECT id FROM payslips WHERE payrun_id = ? AND employee_id = ?',
        [payrunId, emp.id]
      );

      if (existing.length > 0) {
        // Update
        await connection.query(
          `UPDATE payslips SET 
            salary_structure_id=?, pay_period=?, worked_days=?, paid_leave_days=?,
            basic_salary=?, hra=?, standard_allowance=?, performance_bonus=?, travel_allowance=?, food_allowance=?, gross_wage=?,
            pf_employee=?, pf_employer=?, professional_tax=?, total_deductions=?, net_payable=?, generated_at=NOW()
           WHERE id=?`,
          [
            structure.id, payPeriodStr, attendanceDays, paidLeaveDays,
            basicSalary, hra, standardAllowance, performanceBonus, travelAllowance, foodAllowance, grossWage,
            pfEmployee, pfEmployer, professionalTax, totalDeductions, netPayable, existing[0].id
          ]
        );
      } else {
        // Insert
        await connection.query(
          `INSERT INTO payslips (
            payrun_id, employee_id, salary_structure_id, pay_period, worked_days, paid_leave_days,
            basic_salary, hra, standard_allowance, performance_bonus, travel_allowance, food_allowance, gross_wage,
            pf_employee, pf_employer, professional_tax, total_deductions, net_payable, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT')`,
          [
            payrunId, emp.id, structure.id, payPeriodStr, attendanceDays, paidLeaveDays,
            basicSalary, hra, standardAllowance, performanceBonus, travelAllowance, foodAllowance, grossWage,
            pfEmployee, pfEmployer, professionalTax, totalDeductions, netPayable
          ]
        );
      }
      generatedCount++;
    }

    await connection.commit();
    return { success: true, count: generatedCount };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = {
  generatePayslipsForPayrun
};
