import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Play, CheckCircle, Eye, PlusCircle } from 'lucide-react';

export const Payroll = () => {
  const { user } = useAuth();
  const [payruns, setPayruns] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', period_start: '', period_end: '' });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('runs');

  const canManage = ['ADMIN', 'PAYROLL_OFFICER'].includes(user?.role);
  const isEmployee = user?.role === 'EMPLOYEE';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!isEmployee) {
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
    setSubmitting(true);
    try {
      await api.post('/payroll/runs', form);
      toast.success('Payrun created!');
      setShowForm(false);
      setForm({ name: '', period_start: '', period_end: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create payrun');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerate = async (id) => {
    if (!window.confirm('Generate payslips for all eligible employees?')) return;
    try {
      await api.post(`/payroll/runs/${id}/generate`);
      toast.success('Payslips generated successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Generation failed');
    }
  };

  const handleValidate = async (id) => {
    if (!window.confirm('Validate this payrun? This will finalize all payslips.')) return;
    try {
      await api.put(`/payroll/runs/${id}/validate`);
      toast.success('Payrun validated!');
      fetchData();
    } catch (err) {
      toast.error('Validation failed');
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
        {canManage && !isEmployee && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            {showForm ? 'Cancel' : 'New Payrun'}
          </button>
        )}
      </div>

      {/* Create Payrun Form */}
      {showForm && canManage && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Payrun</h2>
          <form onSubmit={handleCreateRun} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Run Name *</label>
              <input required type="text" placeholder="e.g. April 2025 Payroll" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
              <input required type="date" value={form.period_start} onChange={(e) => setForm(p => ({ ...p, period_start: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
              <input required type="date" value={form.period_end} min={form.period_start} onChange={(e) => setForm(p => ({ ...p, period_end: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting} className="w-full bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                {submitting ? 'Creating...' : 'Create Payrun'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      {!isEmployee && (
        <div className="flex gap-2 border-b border-gray-200">
          {['runs', 'slips'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'runs' ? 'Pay Runs' : 'Payslips'}
            </button>
          ))}
        </div>
      )}

      {/* Pay Runs Tab */}
      {activeTab === 'runs' && !isEmployee && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Run Name</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center animate-pulse text-gray-500">Loading...</td></tr>
                ) : payruns.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No payruns yet. Create one above.</td></tr>
                ) : (
                  payruns.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{run.name}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(run.period_start).toLocaleDateString()} – {new Date(run.period_end).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <RunStatusBadge status={run.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {run.status === 'DRAFT' && (
                            <>
                              <button onClick={() => handleGenerate(run.id)} className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                <Play className="w-3.5 h-3.5" /> Generate
                              </button>
                              <button onClick={() => handleValidate(run.id)} className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                                <CheckCircle className="w-3.5 h-3.5" /> Validate
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslips Tab */}
      {(activeTab === 'slips' || isEmployee) && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  {!isEmployee && <th className="px-6 py-4">Employee</th>}
                  <th className="px-6 py-4">Pay Period</th>
                  <th className="px-6 py-4">Gross</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4">Net Pay</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={isEmployee ? 5 : 6} className="px-6 py-8 text-center animate-pulse text-gray-500">Loading...</td></tr>
                ) : payslips.length === 0 ? (
                  <tr><td colSpan={isEmployee ? 5 : 6} className="px-6 py-8 text-center text-gray-400">No payslips available.</td></tr>
                ) : (
                  payslips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-gray-50">
                      {!isEmployee && <td className="px-6 py-4 font-medium text-gray-900">{slip.first_name} {slip.last_name}</td>}
                      <td className="px-6 py-4 text-gray-600">{slip.pay_period}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{formatCurrency(slip.gross_wage)}</td>
                      <td className="px-6 py-4 text-red-600">-{formatCurrency(slip.total_deductions)}</td>
                      <td className="px-6 py-4 text-green-700 font-bold">{formatCurrency(slip.net_payable)}</td>
                      <td className="px-6 py-4">
                        <RunStatusBadge status={slip.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const RunStatusBadge = ({ status }) => {
  const styles = {
    DRAFT: 'bg-yellow-50 text-yellow-700',
    VALIDATED: 'bg-green-50 text-green-700',
    DONE: 'bg-green-50 text-green-700',
    CANCELLED: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};
