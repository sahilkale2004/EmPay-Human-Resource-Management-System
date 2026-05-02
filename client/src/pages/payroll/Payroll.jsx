import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Play, CheckCircle, FileText, Eye, Printer, Plus } from 'lucide-react';
import clsx from 'clsx';

export const Payroll = () => {
  const { user } = useAuth();
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [newRun, setNewRun] = useState({ name: '', period_start: '', period_end: '' });

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

  const handleCreateRun = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payroll/runs', newRun);
      toast.success('Payrun created successfully');
      setShowRunModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to create payrun');
    }
  };

  const handleGenerate = async (id) => {
    try {
      await api.post(`/payroll/runs/${id}/generate`);
      toast.success('Payslips generated');
      fetchData();
    } catch (err) {
      toast.error('Generation failed');
    }
  };

  const handleValidate = async (id) => {
    try {
      await api.put(`/payroll/runs/${id}/validate`);
      toast.success('Payrun validated and closed');
      fetchData();
    } catch (err) {
      toast.error('Validation failed');
    }
  };

  if (selectedSlip) return <PayslipDetail slip={selectedSlip} onBack={() => setSelectedSlip(null)} />;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2520]">Payroll</h1>
          <p className="text-[#6B6259] text-sm mt-0.5">Manage pay runs and employee payslips</p>
        </div>
        {activeTab === 'payrun' && canManage && (
          <button 
            onClick={() => setShowRunModal(true)}
            className="flex items-center gap-2 bg-[#5C7A5F] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#4A644C] transition-colors"
          >
            <Plus className="w-4 h-4" /> New Payrun
          </button>
        )}
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
            <SummaryBox title="Total Payroll Cost" value="₹45,50,000" link="Click for detail" />
          </div>

          <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F5F2ED] border-b border-[#DDD8CF]">
                <tr>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Pay Period</th>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Employees</th>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Net Wages</th>
                  <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Status</th>
                  {canManage && <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9E3]">
                {loading ? (
                  <tr><td colSpan={canManage ? 5 : 4} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">Loading…</td></tr>
                ) : payruns.map(run => (
                  <tr key={run.id} className="hover:bg-[#F5F2ED] transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-[#2A2520]">{run.name}</td>
                    <td className="px-6 py-3.5 text-[#6B6259]">{run.employee_count || '12'} Employees</td>
                    <td className="px-6 py-3.5 text-[#2A2520] font-bold">₹{parseFloat(run.total_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-3.5">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-full text-xs font-bold uppercase",
                        run.status === 'VALIDATED' ? "bg-[#4A8C4E]/10 text-[#4A8C4E]" : 
                        run.status === 'DRAFT' ? "bg-gray-100 text-gray-500" :
                        "bg-[#C28A2B]/10 text-[#C28A2B]"
                      )}>{run.status}</span>
                    </td>
                    {canManage && (
                      <td className="px-6 py-3.5 flex items-center justify-center gap-2">
                        {run.status === 'DRAFT' && (
                          <button onClick={() => handleGenerate(run.id)} className="text-xs font-bold text-[#5C7A5F] hover:underline uppercase">Process</button>
                        )}
                        {run.status === 'DONE' && (
                          <button onClick={() => handleValidate(run.id)} className="text-xs font-bold text-[#B84040] hover:underline uppercase">Validate</button>
                        )}
                        {run.status === 'VALIDATED' && (
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Locked</span>
                        )}
                      </td>
                    )}
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
                  <td className="px-6 py-3.5 text-[#6B6259]">₹{parseFloat(slip.gross_wage).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-[#4A8C4E] font-bold">₹{parseFloat(slip.net_payable).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-center">
                    <button onClick={() => setSelectedSlip(slip)} className="text-[#5C7A5F] hover:text-[#3F5C42] font-semibold text-xs uppercase tracking-wide transition-colors">View Slip</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Payrun Modal */}
      {showRunModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateRun} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-[#2A2520]">New Payrun</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Payrun Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. May 2026 Regular"
                  value={newRun.name}
                  onChange={e => setNewRun({...newRun, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5C7A5F]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Start Date</label>
                  <input 
                    type="date" required
                    value={newRun.period_start}
                    onChange={e => setNewRun({...newRun, period_start: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5C7A5F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">End Date</label>
                  <input 
                    type="date" required
                    value={newRun.period_end}
                    onChange={e => setNewRun({...newRun, period_end: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5C7A5F]"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-[#5C7A5F] text-white py-2 rounded-lg font-bold text-sm">Create Payrun</button>
              <button type="button" onClick={() => setShowRunModal(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold text-sm">Cancel</button>
            </div>
          </form>
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
        <span className="text-2xl">₹{parseFloat(slip.net_payable).toLocaleString()}</span>
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
    <span className="font-bold text-[#2A2520]">₹{parseFloat(value || 0).toLocaleString()}</span>
  </div>
);
