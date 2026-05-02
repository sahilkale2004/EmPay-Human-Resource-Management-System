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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2A2520]">Time Off</h1>
          <p className="text-[#6B6259] text-sm mt-0.5">Manage leave requests and allocations</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Request
        </button>
      </div>

      {/* Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {allocations.map(alloc => (
          <div key={alloc.id} className="bg-[#FDFBF8] border border-[#DDD8CF] p-6 rounded-2xl shadow-sm">
            <h3 className="text-[#5C7A5F] font-bold text-base mb-1">{alloc.time_off_type_name}</h3>
            <p className="text-[#9C9286] text-sm font-medium">{parseFloat(alloc.remaining_days).toFixed(0)} days available</p>
            <div className="mt-3 h-2 bg-[#EDE9E3] rounded-full overflow-hidden">
              <div className="h-full bg-[#5C7A5F] rounded-full" style={{width: `${Math.min((parseFloat(alloc.remaining_days)/20)*100, 100)}%`}}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F2ED] border-b border-[#DDD8CF]">
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Name</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Start Date</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">End Date</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Type</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Status</th>
              {isManagement && <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE9E3]">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">Loadingâ€¦</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">No requests found.</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-[#F5F2ED] transition-colors">
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#2A2520] font-medium">{req.first_name} {req.last_name}</td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#6B6259]">{new Date(req.start_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#6B6259]">{new Date(req.end_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#5C7A5F] font-medium">{req.time_off_type_name}</td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3]">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
                      req.status === 'APPROVED' ? 'bg-[#4A8C4E]/10 text-[#4A8C4E]' : 
                      req.status === 'REFUSED' ? 'bg-[#B84040]/10 text-[#B84040]' : 
                      'bg-[#C28A2B]/10 text-[#C28A2B]'
                    )}>
                      {req.status}
                    </span>
                  </td>
                  {isManagement && (
                    <td className="px-6 py-3.5 flex items-center justify-center gap-2">
                      {req.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleApprove(req.id)} className="w-7 h-7 bg-[#4A8C4E] rounded-lg flex items-center justify-center text-white hover:bg-[#3A7040] transition-colors">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRefuse(req.id)} className="w-7 h-7 bg-[#B84040] rounded-lg flex items-center justify-center text-white hover:bg-[#8B2F2F] transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-7 h-7"></div>
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
      {showForm && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#FDFBF8] rounded-2xl shadow-2xl border border-[#DDD8CF] w-full max-w-lg p-7">
           <h2 className="text-lg font-bold text-[#2A2520] mb-6">Time Off Request</h2>
           <div className="space-y-4">
              <ModalField label="Employee" value="[Employee Name]" />
              <ModalField label="Time Off Type" value="[Paid Time Off]" />
              <div className="flex gap-4">
                <ModalField label="From" value="Aug 14" className="flex-1" />
                <ModalField label="To" value="Aug 16" className="flex-1" />
              </div>
              <ModalField label="Allocation" value="03.00 days" />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-[#5C7A5F] hover:bg-[#3F5C42] text-white py-2.5 rounded-xl font-semibold transition-all">Confirm</button>
                <button onClick={() => setShowForm(false)} className="flex-1 bg-[#EDE9E3] hover:bg-[#DDD8CF] text-[#6B6259] py-2.5 rounded-xl font-semibold transition-all">Cancel</button>
              </div>
           </div>
        </div>
      </div>}
    </div>
  );
};

const ModalField = ({ label, value, className }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-[#9C9286] uppercase tracking-widest mb-1.5">{label}</label>
    <div className="border-b border-[#DDD8CF] py-1.5 text-[#2A2520] font-medium">{value}</div>
  </div>
);
