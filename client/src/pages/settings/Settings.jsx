import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Shield, UserPlus, Search } from 'lucide-react';
import clsx from 'clsx';

export const Settings = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/settings/users');
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/settings/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#2A2520]">User Settings</h1>
        <p className="text-[#6B6259] text-sm mt-0.5">Manage system user roles and access permissions</p>
      </div>

      <div className="bg-[#FDFBF8] border border-[#DDD8CF] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#F5F2ED] border-b border-[#DDD8CF]">
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">User Name</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Login ID</th>
              <th className="px-6 py-3.5 border-r border-[#DDD8CF] font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Email</th>
              <th className="px-6 py-3.5 font-semibold text-[#6B6259] text-xs uppercase tracking-wider">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE9E3]">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">Loading settings...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-[#9C9286] text-sm italic">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F5F2ED] transition-colors">
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#2A2520] font-semibold">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#6B6259] font-mono text-xs">
                    {u.login_id}
                  </td>
                  <td className="px-6 py-3.5 border-r border-[#EDE9E3] text-[#5C7A5F] underline">
                    {u.email}
                  </td>
                  <td className="px-6 py-3.5">
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-[#F5F2ED] border border-[#DDD8CF] rounded-lg px-2.5 py-1.5 text-sm text-[#2A2520] font-medium cursor-pointer focus:outline-none focus:border-[#5C7A5F] transition-colors"
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="HR_OFFICER">HR Officer</option>
                      <option value="PAYROLL_OFFICER">Payroll Officer</option>
                      <option value="EMPLOYEE">Employee</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-[#5C7A5F]/5 border border-[#5C7A5F]/20 p-5 rounded-xl">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-[#5C7A5F] shrink-0 mt-0.5" />
          <p className="text-xs text-[#3F5C42] leading-relaxed">
            <strong>Access Control:</strong> The administrator can assign user access rights based on each user's role.
            Access rights are configured on a module basis, allowing specific permissions for each module.
          </p>
        </div>
      </div>
    </div>
  );
};
