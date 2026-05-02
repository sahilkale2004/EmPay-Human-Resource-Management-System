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
    <div className="space-y-6 font-sans">
      <div className="flex border-b border-gray-300">
        <button onClick={() => setActiveTab('dashboard')} className={clsx("px-8 py-3 font-bold text-sm uppercase tracking-wider", activeTab === 'dashboard' ? "bg-primary text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}>Dashboard</button>
        <button onClick={() => setActiveTab('payrun')} className={clsx("px-8 py-3 font-bold text-sm uppercase tracking-wider", activeTab === 'payrun' ? "bg-primary text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200")}>Payrun</button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SummaryBox title="Total Employee" value={payslips.length} link="Click for detail" />
            <SummaryBox title="Total Payroll cost" value="₹45,50,000.00" link="Click for detail" />
          </div>

          <div className="bg-white border border-gray-300 rounded overflow-hidden">
             <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-700">Pay Period</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Employees</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Net Wages</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center animate-pulse text-gray-400">Loading...</td></tr>
                  ) : payruns.map(run => (
                    <tr key={run.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                      <td className="px-6 py-3 font-medium text-gray-900">{run.name}</td>
                      <td className="px-6 py-3 text-gray-600">12 Employees</td>
                      <td className="px-6 py-3 text-gray-900 font-bold">₹1,20,000</td>
                      <td className="px-6 py-3">
                        <span className={clsx("text-xs font-bold uppercase", run.status === 'DONE' ? "text-green-600" : "text-amber-500")}>{run.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-300 rounded overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
             <thead className="bg-gray-50 border-b border-gray-300">
               <tr>
                 <th className="px-6 py-3 font-medium text-gray-700">Name</th>
                 <th className="px-6 py-3 font-medium text-gray-700">Pay Period</th>
                 <th className="px-6 py-3 font-medium text-gray-700">Gross</th>
                 <th className="px-6 py-3 font-medium text-gray-700">Net Pay</th>
                 <th className="px-6 py-3 text-center">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-300">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : payslips.map(slip => (
                  <tr key={slip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">[{slip.first_name} {slip.last_name}]</td>
                    <td className="px-6 py-3 text-gray-600">{slip.pay_period}</td>
                    <td className="px-6 py-3 text-gray-600">₹{parseFloat(slip.gross_wage).toLocaleString()}</td>
                    <td className="px-6 py-3 text-green-600 font-bold">₹{parseFloat(slip.net_payable).toLocaleString()}</td>
                    <td className="px-6 py-3 text-center">
                       <button onClick={() => setSelectedSlip(slip)} className="text-primary hover:underline font-bold text-xs uppercase">View Slip</button>
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
  <div className="bg-white border border-gray-300 p-6 rounded shadow-sm flex flex-col items-center justify-center">
    <h3 className="text-primary font-bold text-lg mb-2">{title}</h3>
    <span className="text-3xl font-bold text-gray-800 mb-2">{value}</span>
    <button className="text-[10px] font-bold text-blue-500 uppercase hover:underline">{link}</button>
  </div>
);

const PayslipDetail = ({ slip, onBack }) => (
  <div className="space-y-6 font-sans max-w-4xl mx-auto">
    <div className="flex justify-between items-center bg-white p-4 border border-gray-300 rounded shadow-sm">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm font-bold uppercase">
        <Printer className="w-4 h-4" /> Print
      </button>
      <h2 className="font-bold text-gray-800 uppercase tracking-widest text-sm">Payslip Details</h2>
      <div className="w-20"></div>
    </div>

    <div className="bg-white border border-gray-300 p-10 rounded shadow-sm space-y-8">
      <div className="flex justify-between border-b border-gray-200 pb-8">
        <div>
           <h1 className="text-2xl font-bold text-primary mb-2">EmPay HRMS</h1>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Salary Slip for month of {slip.pay_period}</p>
        </div>
        <div className="text-right space-y-1">
           <InfoRow label="Employee Name" value={`${slip.first_name} ${slip.last_name}`} />
           <InfoRow label="Employee ID" value={slip.login_id} />
           <InfoRow label="Department" value={slip.department} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-10">
         <div className="space-y-4">
            <h3 className="bg-gray-100 px-4 py-1.5 font-bold text-xs uppercase tracking-widest border border-gray-300">Earnings</h3>
            <div className="space-y-2">
               <SlipItem label="Basic Salary" value={slip.basic_wage} />
               <SlipItem label="House Rent Allowance" value={slip.hra} />
               <SlipItem label="Standard Allowance" value={slip.standard_allowance} />
            </div>
         </div>
         <div className="space-y-4">
            <h3 className="bg-gray-100 px-4 py-1.5 font-bold text-xs uppercase tracking-widest border border-gray-300">Deductions</h3>
            <div className="space-y-2">
               <SlipItem label="Provident Fund" value={slip.pf} />
               <SlipItem label="Professional Tax" value={slip.professional_tax} />
            </div>
         </div>
      </div>

      <div className="flex justify-between items-center bg-primary p-4 text-white rounded font-bold uppercase tracking-widest">
         <span>Total Net Payable</span>
         <span className="text-2xl">₹{parseFloat(slip.net_payable).toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex text-[10px]">
    <span className="w-24 text-gray-400 font-bold uppercase">{label} :-</span>
    <span className="text-gray-800 font-bold">{value}</span>
  </div>
);

const SlipItem = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-500">{label}</span>
    <span className="font-bold text-gray-800">₹{parseFloat(value || 0).toLocaleString()}</span>
  </div>
);
