import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { PlusCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export const TimeOff = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [timeOffTypes, setTimeOffTypes] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ time_off_type_id: '', start_date: '', end_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const canApprove = ['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER'].includes(user?.role);
  const isEmployee = user?.role === 'EMPLOYEE';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, typesRes, allocRes] = await Promise.all([
        api.get('/timeoff'),
        api.get('/timeoff/types'),
        api.get('/timeoff/allocation'),
      ]);
      setRequests(reqRes.data.data || []);
      setTimeOffTypes(typesRes.data.data || []);
      setAllocations(allocRes.data.data || []);
    } catch (err) {
      toast.error('Failed to load time off data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/timeoff', form);
      toast.success('Time off request submitted!');
      setShowForm(false);
      setForm({ time_off_type_id: '', start_date: '', end_date: '', reason: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/timeoff/${id}/approve`);
      toast.success('Request approved!');
      fetchData();
    } catch (err) {
      toast.error('Failed to approve request');
    }
  };

  const handleRefuse = async (id) => {
    try {
      await api.put(`/timeoff/${id}/refuse`);
      toast.success('Request refused');
      fetchData();
    } catch (err) {
      toast.error('Failed to refuse request');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Time Off</h1>
        {(isEmployee || canApprove) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
          >
            <PlusCircle className="w-5 h-5" />
            {showForm ? 'Cancel' : 'New Request'}
          </button>
        )}
      </div>

      {/* Allocation Balance Cards */}
      {allocations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {allocations.map((alloc) => (
            <div key={alloc.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">{alloc.time_off_type_name}</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-gray-900">{parseFloat(alloc.remaining_days).toFixed(0)}</span>
                <span className="text-gray-400 mb-1">/ {parseFloat(alloc.allocated_days).toFixed(0)} days remaining</span>
              </div>
              <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (alloc.remaining_days / alloc.allocated_days) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Request Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">New Time Off Request</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
              <select
                required
                value={form.time_off_type_id}
                onChange={(e) => setForm(p => ({ ...p, time_off_type_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select type...</option>
                {timeOffTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1"></div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input
                required type="date"
                value={form.start_date}
                onChange={(e) => setForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input
                required type="date"
                value={form.end_date}
                min={form.start_date}
                onChange={(e) => setForm(p => ({ ...p, end_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm(p => ({ ...p, reason: e.target.value }))}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                placeholder="Optional reason for leave..."
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-gray-900">Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                {canApprove && <th className="px-6 py-4">Employee</th>}
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Status</th>
                {canApprove && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={canApprove ? 6 : 4} className="px-6 py-8 text-center animate-pulse text-gray-500">Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={canApprove ? 6 : 4} className="px-6 py-8 text-center text-gray-400">No requests found.</td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    {canApprove && (
                      <td className="px-6 py-4 font-medium text-gray-900">{req.first_name} {req.last_name}</td>
                    )}
                    <td className="px-6 py-4 text-gray-600">{req.time_off_type_name}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(req.start_date).toLocaleDateString()} – {new Date(req.end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{req.number_of_days} days</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    {canApprove && req.status === 'PENDING' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleApprove(req.id)} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleRefuse(req.id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    )}
                    {canApprove && req.status !== 'PENDING' && <td className="px-6 py-4"></td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-yellow-50 text-yellow-700',
    APPROVED: 'bg-green-50 text-green-700',
    REFUSED: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};
