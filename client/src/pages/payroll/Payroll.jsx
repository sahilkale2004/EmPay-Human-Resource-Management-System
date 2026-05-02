import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Play, CheckCircle, FileText, Eye, Printer } from 'lucide-react';
import clsx from 'clsx';

export const Payroll = () => {
  const { user } = useAuth();
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSlip, setSelectedSlip] = useState(null);

  const canManage = ['ADMIN', 'PAYROLL_OFFICER'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (canManage) {
        const runRes = await api.get('/payroll/runs');
        setPayruns(runRes.data.data || []);
      }
      const slipRes = await api.get('/payroll/slips');
      setPayslips(slipRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  if (selectedSlip) return <PayslipDetail slip={selectedSlip} onBack={() => setSelectedSlip(null)} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2A2520]">Payroll</h1>
        <p className="text-[#6B6259] text-sm mt-0.5">Manage pay runs and employee payslips</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#DDD8CF]">
        <button onClick={() => setActiveTab('dashboard')} className={clsx(
          "px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-px",
          activeTab === 'dashboard' 
            ? "border-[#5C7A5F] text-[#5C7A5F]" 
            : "border-transparent text-[#9C9286] hover:text-[#6B6259]"
        )}>Dashboard</button>
        <button onClick={() => setActiveTab('payrun')} className={clsx(
          "px-6 py-3 font-semibold text-sm transition-all border-b-2 -mb-px",
          activeTab === 'payrun' 
            ? "border-[#5C7A5F] text-[#5C7A5F]" 
            : "border-transparent text-[#9C9286] hover:text-[#6B6259]"
        )}>Payrun</button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <SummaryBox title="Total Employees" value={payslips.length} link="Click for detail" />
            <SummaryBox title="Total Payroll Cost" value="â‚¹45,50,000" link="Click for detail" />
          </div>

          <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F5F2ED] border-b border-[#DDD8CF]">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Pay Period</th>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Net Wages</th>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9E3]">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">Loadingâ€¦</td></tr>
                ) : payruns.map(run => (
                  <tr key={run.id} className="hover:bg-[#F5F2ED] transition-colors cursor-pointer">
                    <td className="px-6 py-3.5 font-semibold text-[#2A2520]">{run.name}</td>
                    <td className="px-6 py-3.5 text-[#6B6259]">12 Employees</td>
                    <td className="px-6 py-3.5 text-[#2A2520] font-bold">â‚¹1,20,000</td>
                    <td className="px-6 py-3.5">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                        run.status === 'DONE' ? "bg-[#4A8C4E]/10 text-[#4A8C4E]" : "bg-[#C28A2B]/10 text-[#C28A2B]"
                      )}>{run.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F5F2ED] border-b border-[#DDD8CF]">
              <tr>
                <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Name</th>
                <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Pay Period</th>
                <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Gross</th>
                <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Net Pay</th>
                <th className="px-6 py-3.5 text-center font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EDE9E3]">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">Loadingâ€¦</td></tr>
              ) : payslips.map(slip => (
                <tr key={slip.id} className="hover:bg-[#F5F2ED] transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-[#2A2520]">{slip.first_name} {slip.last_name}</td>
                  <td className="px-6 py-3.5 text-[#6B6259]">{slip.pay_period}</td>
                  <td className="px-6 py-3.5 text-[#6B6259]">â‚¹{parseFloat(slip.gross_wage).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-[#4A8C4E] font-bold">â‚¹{parseFloat(slip.net_payable).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-center">
                    <button onClick={() => setSelectedSlip(slip)} className="text-[#5C7A5F] hover:text-[#3F5C42] font-semibold text-xs uppercase tracking-wide transition-colors">View Slip</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const SummaryBox = ({ title, value, link }) => (
  <div className="bg-[#FDFBF8] border border-[#DDD8CF] p-6 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center">
    <h3 className="text-[#5C7A5F] font-bold text-base mb-2">{title}</h3>
    <span className="text-3xl font-bold text-[#2A2520] mb-2">{value}</span>
    <button className="text-[10px] font-bold text-[#8B7355] uppercase tracking-wider hover:underline">{link}</button>
  </div>
);

const PayslipDetail = ({ slip, onBack }) => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <div className="flex justify-between items-center bg-[#FDFBF8] p-4 border border-[#DDD8CF] rounded-2xl shadow-sm">
      <button onClick={onBack} className="text-[#6B6259] hover:text-[#2A2520] flex items-center gap-2 text-sm font-semibold transition-colors">
        <Printer className="w-4 h-4" /> Print
      </button>
      <h2 className="font-bold text-[#2A2520] uppercase tracking-widest text-sm">Payslip Details</h2>
      <div className="w-20"></div>
    </div>

    <div className="bg-[#FDFBF8] border border-[#DDD8CF] p-10 rounded-2xl shadow-sm space-y-8">
      <div className="flex justify-between border-b border-[#EDE9E3] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5C7A5F] mb-1">EmPay HRMS</h1>
          <p className="text-[10px] font-bold text-[#9C9286] uppercase tracking-widest">Salary Slip for month of {slip.pay_period}</p>
        </div>
        <div className="text-right space-y-1">
          <InfoRow label="Employee Name" value={`${slip.first_name} ${slip.last_name}`} />
          <InfoRow label="Employee ID" value={slip.login_id} />
          <InfoRow label="Department" value={slip.department} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
        <div className="space-y-4">
          <h3 className="bg-[#F5F2ED] border border-[#DDD8CF] px-4 py-2 font-bold text-xs uppercase tracking-widest text-[#5C7A5F] rounded-lg">Earnings</h3>
          <div className="space-y-2">
            <SlipItem label="Basic Salary" value={slip.basic_wage} />
            <SlipItem label="House Rent Allowance" value={slip.hra} />
            <SlipItem label="Standard Allowance" value={slip.standard_allowance} />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="bg-[#F5F2ED] border border-[#DDD8CF] px-4 py-2 font-bold text-xs uppercase tracking-widest text-[#B84040] rounded-lg">Deductions</h3>
          <div className="space-y-2">
            <SlipItem label="Provident Fund" value={slip.pf} />
            <SlipItem label="Professional Tax" value={slip.professional_tax} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#1C2B1E] p-5 text-white rounded-xl font-bold uppercase tracking-widest">
        <span>Total Net Payable</span>
        <span className="text-2xl">â‚¹{parseFloat(slip.net_payable).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex text-[10px]">
    <span className="w-28 text-[#9C9286] font-bold uppercase">{label} :-</span>
    <span className="text-[#2A2520] font-bold">{value}</span>
  </div>
);

const SlipItem = ({ label, value }) => (
  <div className="flex justify-between text-sm py-1 border-b border-[#EDE9E3]">
    <span className="text-[#6B6259]">{label}</span>
    <span className="font-bold text-[#2A2520]">â‚¹{parseFloat(value || 0).toLocaleString()}</span>
  </div>
);
