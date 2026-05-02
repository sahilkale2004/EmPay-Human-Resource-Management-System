import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Play, CheckCircle, FileText, Eye, Printer, Plus, Users, CreditCard, ArrowRight } from 'lucide-react';
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
  const [stats, setStats] = useState({ totalEmployees: 0, totalCost: 0 });
  const [fundBalance, setFundBalance] = useState(0);

  const canManage = ['ADMIN', 'PAYROLL_OFFICER'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (canManage) {
        const runRes = await api.get('/payroll/runs');
        setPayruns(runRes.data.data || []);
        
        const statsRes = await api.get('/payroll/stats');
        setStats(statsRes.data.data || { totalEmployees: 0, totalCost: 0 });

        const fundRes = await api.get('/payroll/fund');
        setFundBalance(fundRes.data.data?.balance || 0);
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

  const handleAddFunds = async () => {
    try {
      await api.post('/payroll/fund/add', { amount: 5000000 });
      toast.success('Added ₹50,00,000 to company fund');
      fetchData();
    } catch (err) {
      toast.error('Failed to add funds');
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
      toast.error(err.response?.data?.error || 'Validation failed');
    }
  };

  const handleExport = async (id) => {
    try {
      const { data } = await api.post(`/payroll/runs/${id}/export`);
      toast.success(data.message || 'Payslips exported successfully');
    } catch (err) {
      toast.error('Export failed');
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SummaryBox title="Total Employees" value={stats.totalEmployees} link="View Directory" icon={Users} color="text-primary" bg="bg-primary/5" />
            <SummaryBox title="Payroll Budget" value={`₹${parseFloat(stats.totalCost).toLocaleString('en-IN')}`} link="View Budget" icon={CreditCard} color="text-secondary" bg="bg-secondary/5" />
            {canManage && (
              <div className="bg-white border border-border p-7 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
                <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform"></div>
                <h3 className="text-muted font-black text-[10px] uppercase tracking-[0.2em] mb-3">Company Fund</h3>
                <span className="text-3xl font-bold text-text mb-3">₹{parseFloat(fundBalance).toLocaleString('en-IN')}</span>
                <button 
                  onClick={handleAddFunds} 
                  className="text-[10px] font-black text-primary uppercase tracking-[0.1em] hover:bg-primary/10 bg-primary/5 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 border border-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Inject Funds
                </button>
              </div>
            )}
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
                    <td className="px-6 py-3.5 text-[#6B6259]">{run.employee_count ?? 0} Employees</td>
                    <td className="px-6 py-3.5 text-[#2A2520] font-bold">₹{parseFloat(run.total_amount || 0).toLocaleString('en-IN')}</td>
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
                        {(run.status === 'DRAFT' || run.status === 'DONE') && (
                          <button onClick={() => handleGenerate(run.id)} className="text-xs font-bold text-[#5C7A5F] hover:underline uppercase">
                            {run.status === 'DONE' ? 'Re-Process' : 'Process'}
                          </button>
                        )}
                        {run.status === 'DONE' && (
                          <button onClick={() => handleValidate(run.id)} className="text-xs font-bold text-[#B84040] hover:underline uppercase">Validate</button>
                        )}
                        {run.status === 'VALIDATED' && (
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Locked</span>
                        )}
                        {run.employee_count > 0 && (
                          <button onClick={() => handleExport(run.id)} className="text-xs font-bold text-[#2A2520] hover:underline uppercase ml-2">Export</button>
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
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">Loading...</td></tr>
              ) : payslips.map(slip => (
                <tr key={slip.id} className="hover:bg-[#F5F2ED] transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-[#2A2520]">{slip.first_name} {slip.last_name}</td>
                  <td className="px-6 py-3.5 text-[#6B6259]">{slip.payrun_name}</td>
                  <td className="px-6 py-3.5 text-[#6B6259]">₹{parseFloat(slip.gross_wage).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-3.5 text-[#4A8C4E] font-bold">₹{parseFloat(slip.net_payable).toLocaleString('en-IN')}</td>
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

const SummaryBox = ({ title, value, link, icon: Icon, color, bg }) => (
  <div className={clsx("bg-white border border-border p-7 rounded-[2.5rem] shadow-sm flex flex-col items-center justify-center text-center group hover:shadow-2xl transition-all duration-500 relative overflow-hidden", bg)}>
    <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", bg, color)}>
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-muted font-black text-[10px] uppercase tracking-[0.2em] mb-2">{title}</h3>
    <span className="text-3xl font-bold text-text mb-3">{value}</span>
    <button className="text-[10px] font-black text-text-soft uppercase tracking-[0.1em] hover:text-primary transition-colors flex items-center gap-1">
      {link} <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
    </button>
  </div>
);

const PayslipDetail = ({ slip, onBack }) => (
  <div className="space-y-6 max-w-4xl mx-auto">
    <div className="flex justify-between items-center bg-[#FDFBF8] p-4 border border-[#DDD8CF] rounded-2xl shadow-sm">
      <button onClick={onBack} className="text-[#6B6259] hover:text-[#2A2520] flex items-center gap-2 text-sm font-semibold transition-colors">
        ← Back
      </button>
      <h2 className="font-bold text-[#2A2520] uppercase tracking-widest text-sm">Payslip Details</h2>
      <button onClick={() => window.print()} className="text-[#5C7A5F] hover:text-[#4A644C] flex items-center gap-2 text-sm font-semibold transition-colors">
        <Printer className="w-4 h-4" /> Print
      </button>
    </div>

    <div className="bg-[#FDFBF8] border border-[#DDD8CF] p-10 rounded-2xl shadow-sm space-y-8">
      <div className="flex justify-between border-b border-[#EDE9E3] pb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#5C7A5F] mb-1">EmPay HRMS</h1>
          <p className="text-[10px] font-bold text-[#9C9286] uppercase tracking-widest">Salary Slip for month of {slip.payrun_name}</p>
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
            <SlipItem label="Basic Salary" value={slip.basic_salary} />
            <SlipItem label="House Rent Allowance" value={slip.hra} />
            <SlipItem label="Standard Allowance" value={slip.standard_allowance} />
            {Number(slip.performance_bonus) > 0 && <SlipItem label="Performance Bonus" value={slip.performance_bonus} />}
            {Number(slip.travel_allowance) > 0 && <SlipItem label="Travel Allowance" value={slip.travel_allowance} />}
            {Number(slip.food_allowance) > 0 && <SlipItem label="Food Allowance" value={slip.food_allowance} />}
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="bg-[#F5F2ED] border border-[#DDD8CF] px-4 py-2 font-bold text-xs uppercase tracking-widest text-[#B84040] rounded-lg">Deductions</h3>
          <div className="space-y-2">
            <SlipItem label="Provident Fund" value={slip.pf_employee} />
            <SlipItem label="Professional Tax" value={slip.professional_tax} />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#1C2B1E] p-5 text-white rounded-xl font-bold uppercase tracking-widest">
        <span>Total Net Payable</span>
        <span className="text-2xl">₹{parseFloat(slip.net_payable).toLocaleString('en-IN')}</span>
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
    <span className="font-bold text-[#2A2520]">₹{parseFloat(value || 0).toLocaleString('en-IN')}</span>
  </div>
);
