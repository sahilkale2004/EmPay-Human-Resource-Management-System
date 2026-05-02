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
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-4 bg-white p-2 rounded border border-gray-300">
        <button 
          onClick={() => setShowForm(true)}
          className="bg-primary text-white px-6 py-1.5 rounded text-sm font-bold uppercase tracking-wider"
        >
          NEW
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder="Searchbar" 
            className="w-full bg-white border border-gray-300 rounded px-4 py-1.5 text-sm focus:outline-none focus:border-primary text-center"
          />
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allocations.map(alloc => (
          <div key={alloc.id} className="bg-white border border-gray-300 p-6 rounded shadow-sm text-center">
            <h3 className="text-primary font-bold text-lg mb-1">{alloc.time_off_type_name}</h3>
            <p className="text-gray-400 text-xs font-bold uppercase">{parseFloat(alloc.remaining_days).toFixed(0)} days Available</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300">
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Name</th>
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Start Date</th>
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">End Date</th>
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Time Off Type</th>
              <th className="px-6 py-3 border-r border-gray-300 font-medium text-gray-700">Status</th>
              {isManagement && <th className="px-6 py-3 font-medium text-gray-700 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center animate-pulse text-gray-400">Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">No requests found.</td></tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 border-r border-gray-300 text-gray-600 font-medium">[{req.first_name} {req.last_name}]</td>
                  <td className="px-6 py-3 border-r border-gray-300 text-gray-600">{new Date(req.start_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-3 border-r border-gray-300 text-gray-600">{new Date(req.end_date).toLocaleDateString('en-GB')}</td>
                  <td className="px-6 py-3 border-r border-gray-300 text-primary font-medium">{req.time_off_type_name}</td>
                  <td className="px-6 py-3 border-r border-gray-300">
                    <span className={clsx(
                      "font-bold text-xs uppercase",
                      req.status === 'APPROVED' ? 'text-green-600' : req.status === 'REFUSED' ? 'text-red-600' : 'text-amber-500'
                    )}>
                      {req.status}
                    </span>
                  </td>
                  {isManagement && (
                    <td className="px-6 py-3 flex items-center justify-center gap-2">
                      {req.status === 'PENDING' ? (
                        <>
                          <button onClick={() => handleApprove(req.id)} className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white hover:bg-green-600">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRefuse(req.id)} className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white hover:bg-red-600">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="w-6 h-6"></div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Placeholder logic could go here */}
      {showForm && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-lg p-6">
           <h2 className="text-lg font-bold mb-6">Time off Request</h2>
           <div className="space-y-4">
              <ModalField label="Employee" value="[Employee Name]" />
              <ModalField label="Time off Type" value="[Paid Time Off]" />
              <div className="flex gap-4">
                <ModalField label="From" value="Aug 14" className="flex-1" />
                <ModalField label="To" value="Aug 16" className="flex-1" />
              </div>
              <ModalField label="Allocation" value="03.00 days" />
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowForm(false)} className="flex-1 bg-primary text-white py-2 rounded font-bold uppercase">Confirm</button>
                <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded font-bold uppercase">Cancel</button>
              </div>
           </div>
        </div>
      </div>}
    </div>
  );
};

const ModalField = ({ label, value, className }) => (
  <div className={className}>
    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">{label}</label>
    <div className="border-b border-gray-300 py-1 text-gray-700 font-medium">{value}</div>
  </div>
);
