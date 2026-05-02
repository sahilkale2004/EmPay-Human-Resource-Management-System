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
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
         <h1 className="text-xl font-bold text-gray-800">User Setting</h1>
         <div className="flex gap-2">
            <div className="w-6 h-6 bg-red-600 rounded-full"></div>
            <div className="w-6 h-6 bg-blue-400 rounded-sm"></div>
         </div>
      </div>

      <div className="bg-white border border-gray-300 rounded overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-300 font-bold text-gray-400 uppercase tracking-widest text-[10px]">
              <th className="px-6 py-4 border-r border-gray-300">User name</th>
              <th className="px-6 py-4 border-r border-gray-300">Login id</th>
              <th className="px-6 py-4 border-r border-gray-300">Email</th>
              <th className="px-6 py-4">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center animate-pulse text-gray-400">Loading settings...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 border-r border-gray-300 text-gray-800 font-medium">
                    {u.first_name} {u.last_name}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-300 text-gray-600">
                    {u.login_id}
                  </td>
                  <td className="px-6 py-4 border-r border-gray-300 text-gray-600 underline">
                    {u.email}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={u.role} 
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer"
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

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg">
         <p className="text-xs text-amber-800 leading-relaxed">
           - In the Admin Settings, the administrator can assign user access rights based on each user's role.<br/>
           - Access rights can be configured on a module basis, allowing specific permissions for each module.
         </p>
      </div>
    </div>
  );
};
