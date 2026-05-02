const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generatePayslipPDF = async (slip, payrunName, exportDir) => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure export directory exists
      const monthDir = path.join(exportDir, payrunName);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }

      const fileName = `${slip.first_name}_${slip.last_name}_${slip.login_id}_Payslip.pdf`.replace(/[^a-z0-9_.-]/gi, '_');
      const filePath = path.join(monthDir, fileName);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- Header ---
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#5C7A5F').text('EmPay HRMS', { align: 'left' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#9C9286').text(`SALARY SLIP FOR MONTH OF ${slip.pay_period.toUpperCase()}`, { align: 'left' });
      
      doc.moveDown(1);
      
      // --- Employee Info ---
      doc.fontSize(10).fillColor('#6B6259').font('Helvetica');
      doc.text(`Employee Name: `, { continued: true }).font('Helvetica-Bold').fillColor('#2A2520').text(`${slip.first_name} ${slip.last_name}`);
      doc.font('Helvetica').fillColor('#6B6259').text(`Employee ID: `, { continued: true }).font('Helvetica-Bold').fillColor('#2A2520').text(`${slip.login_id}`);
      doc.font('Helvetica').fillColor('#6B6259').text(`Department: `, { continued: true }).font('Helvetica-Bold').fillColor('#2A2520').text(`${slip.department || '-'}`);
      
      doc.moveDown(2);

      // --- Tables ---
      const tableTop = doc.y;

      // Earnings Table
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#5C7A5F').text('EARNINGS', 50, tableTop);
      doc.rect(50, tableTop + 20, 240, 0).strokeColor('#EDE9E3').stroke();
      
      let currentY = tableTop + 30;
      doc.font('Helvetica').fontSize(10).fillColor('#6B6259');
      
      doc.text('Basic Salary', 50, currentY);
      doc.font('Helvetica-Bold').fillColor('#2A2520').text(`Rs. ${parseFloat(slip.basic_salary).toLocaleString('en-IN')}`, 200, currentY, { width: 90, align: 'right' });
      
      currentY += 20;
      doc.font('Helvetica').fillColor('#6B6259').text('House Rent Allowance', 50, currentY);
      doc.font('Helvetica-Bold').fillColor('#2A2520').text(`Rs. ${parseFloat(slip.hra).toLocaleString('en-IN')}`, 200, currentY, { width: 90, align: 'right' });
      
      currentY += 20;
      doc.font('Helvetica').fillColor('#6B6259').text('Standard Allowance', 50, currentY);
      doc.font('Helvetica-Bold').fillColor('#2A2520').text(`Rs. ${parseFloat(slip.standard_allowance).toLocaleString('en-IN')}`, 200, currentY, { width: 90, align: 'right' });

      // Deductions Table
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#B84040').text('DEDUCTIONS', 320, tableTop);
      doc.rect(320, tableTop + 20, 240, 0).strokeColor('#EDE9E3').stroke();
      
      let currentYD = tableTop + 30;
      doc.font('Helvetica').fontSize(10).fillColor('#6B6259');
      
      doc.text('Provident Fund', 320, currentYD);
      doc.font('Helvetica-Bold').fillColor('#2A2520').text(`Rs. ${parseFloat(slip.pf_employee).toLocaleString('en-IN')}`, 470, currentYD, { width: 90, align: 'right' });
      
      currentYD += 20;
      doc.font('Helvetica').fillColor('#6B6259').text('Professional Tax', 320, currentYD);
      doc.font('Helvetica-Bold').fillColor('#2A2520').text(`Rs. ${parseFloat(slip.professional_tax).toLocaleString('en-IN')}`, 470, currentYD, { width: 90, align: 'right' });

      // Net Payable Box
      const boxY = Math.max(currentY, currentYD) + 40;
      doc.rect(50, boxY, 510, 40).fillAndStroke('#1C2B1E', '#1C2B1E');
      doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(14).text('TOTAL NET PAYABLE', 70, boxY + 14);
      doc.fontSize(16).text(`Rs. ${parseFloat(slip.net_payable).toLocaleString('en-IN')}`, 400, boxY + 12, { width: 140, align: 'right' });

      // Footer
      doc.fillColor('#9C9286').fontSize(8).font('Helvetica-Oblique').text('This is a computer-generated document. No signature is required.', 50, doc.page.height - 50, { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generatePayslipPDF
};
