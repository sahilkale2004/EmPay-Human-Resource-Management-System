import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Search, Plus, Check, X, Clock } from 'lucide-react';
import clsx from 'clsx';

export const TimeOff = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ employee_id: '', time_off_type_id: '', start_date: '', end_date: '', reason: '' });

  const isManagement = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, allocRes] = await Promise.all([
        api.get('/timeoff'),
        api.get('/timeoff/allocation'),
      ]);
      setRequests(reqRes.data.data || []);
      setAllocations(allocRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load time off data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.post('/timeoff', {
        ...form,
        employee_id: user.employee_id
      });
      toast.success('Request submitted');
      setShowForm(false);
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to submit request';
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/timeoff/${id}/approve`);
      toast.success('Approved');
      fetchData();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleRefuse = async (id) => {
    try {
      await api.put(`/timeoff/${id}/refuse`);
      toast.success('Refused');
      fetchData();
    } catch (err) {
      toast.error('Failed to refuse');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text">Time Off</h1>
          <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Manage leave requests and allocations</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all shadow-lg shadow-primary/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> New Request
        </button>
      </div>

      {/* Summary Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allocations.map(alloc => (
          <div key={alloc.id} className="bg-white border border-border p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
            <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <h3 className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-2">{alloc.time_off_type_name}</h3>
            <p className="text-3xl font-bold text-text mb-4">{parseFloat(alloc.remaining_days).toFixed(0)} <span className="text-sm font-bold text-muted uppercase">Days Left</span></p>
            <div className="h-2 bg-surface rounded-full overflow-hidden border border-border/50">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000" 
                style={{width: `${Math.min((parseFloat(alloc.remaining_days)/20)*100, 100)}%`}}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-surface border-b border-border">
              <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest">Name</th>
              <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest">Start Date</th>
              <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest">End Date</th>
              <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest">Type</th>
              <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest">Status</th>
              {isManagement && <th className="px-6 py-4 font-bold text-muted text-[10px] uppercase tracking-widest text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted text-sm italic">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted text-sm italic">No requests found.</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4 text-text font-bold">{req.first_name} {req.last_name}</td>
                  <td className="px-6 py-4 text-text-soft font-medium">{new Date(req.start_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4 text-text-soft font-medium">{new Date(req.end_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-4 text-primary font-bold">{req.time_off_type_name}</td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      req.status === 'APPROVED' ? 'bg-success/10 text-success' : 
                      req.status === 'REFUSED' ? 'bg-error/10 text-error' : 
                      'bg-warning/10 text-warning'
                    )}>
                      {req.status}
                    </span>
                  </td>
                  {isManagement && (
                    <td className="px-6 py-4 flex items-center justify-center gap-2">
                      {req.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleApprove(req.id)} className="w-8 h-8 bg-success rounded-xl flex items-center justify-center text-white hover:bg-success/80 transition-colors shadow-lg shadow-success/20">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRefuse(req.id)} className="w-8 h-8 bg-error rounded-xl flex items-center justify-center text-white hover:bg-error/80 transition-colors shadow-lg shadow-error/20">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-8 h-8"></div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] shadow-2xl border border-border w-full max-w-lg p-8 animate-fade-in">
           <h2 className="text-xl font-bold text-text mb-6">Request Time Off</h2>
           
           {/* API Error Alert */}
           {formError && (
             <div className="mb-6 p-4 bg-error/5 border border-error/20 text-error text-xs font-bold rounded-2xl">
               {formError}
             </div>
           )}

           <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Time Off Type</label>
                <select 
                  required
                  value={form.time_off_type_id}
                  onChange={(e) => {
                    setForm({...form, time_off_type_id: e.target.value});
                    setFormError('');
                  }}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium"
                >
                  <option value="">Select Type</option>
                  {allocations.map(a => (
                    <option key={a.time_off_type_id} value={a.time_off_type_id}>{a.time_off_type_name}</option>
                  ))}
                </select>
                {allocations.find(a => a.time_off_type_id == form.time_off_type_id)?.time_off_type_name === 'Sick Leave' && (
                  <p className="mt-2 text-[10px] text-primary flex items-center gap-1.5 font-bold italic">
                    ℹ️ Sick leave can only be applied for today or a past date.
                  </p>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Start Date</label>
                  <input 
                    type="date" 
                    required
                    max={allocations.find(a => a.time_off_type_id == form.time_off_type_id)?.time_off_type_name === 'Sick Leave' ? new Date().toISOString().split('T')[0] : undefined}
                    value={form.start_date}
                    onChange={(e) => {
                      setForm({...form, start_date: e.target.value});
                      if (allocations.find(a => a.time_off_type_id == form.time_off_type_id)?.time_off_type_name === 'Sick Leave') {
                        if (new Date(e.target.value) > new Date().setHours(23, 59, 59, 999)) {
                          setFormError('Sick leave cannot be applied for a future date.');
                        } else {
                          setFormError('');
                        }
                      } else {
                        setFormError('');
                      }
                    }}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">End Date</label>
                  <input 
                    type="date" 
                    required
                    max={allocations.find(a => a.time_off_type_id == form.time_off_type_id)?.time_off_type_name === 'Sick Leave' ? new Date().toISOString().split('T')[0] : undefined}
                    value={form.end_date}
                    onChange={(e) => setForm({...form, end_date: e.target.value})}
                    className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">Reason</label>
                <textarea 
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason: e.target.value})}
                  className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium h-28 resize-none"
                  placeholder="Explain your reason..."
                ></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={!!formError || (allocations.find(a => a.time_off_type_id == form.time_off_type_id)?.time_off_type_name === 'Sick Leave' && new Date(form.start_date) > new Date().setHours(23,59,59,999))}
                  className="flex-1 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 transition-all"
                >
                  Submit Request
                </button>
                <button type="button" onClick={() => { setShowForm(false); setFormError(''); }} className="flex-1 bg-surface hover:bg-border/30 text-text-soft py-4 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all border border-border">Cancel</button>
              </div>
           </div>
        </form>
      </div>}
    </div>
  );
};
