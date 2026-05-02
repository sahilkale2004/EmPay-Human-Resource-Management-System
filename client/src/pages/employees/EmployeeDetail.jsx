import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Edit2, Plus, Mail, Phone, MapPin, 
  Shield, CreditCard, Lock, User
} from 'lucide-react';
import clsx from 'clsx';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Resume');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await api.get(`/employees/${id}`);
        if (res.data.success) {
          setEmployee(res.data.data);
          setFormData(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load employee details');
        navigate('/employees');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, navigate]);

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!employee) return <div className="p-10 text-center">Employee not found.</div>;

  const tabs = ['Resume', 'Private Info', 'Salary Info', 'Security'];

  return (
    <div className="bg-white min-h-screen">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start gap-8 p-10 border-b border-gray-200">
        <div className="relative">
          <div className="w-48 h-48 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 border border-pink-200 shadow-inner">
            <Edit2 className="w-8 h-8" />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-medium text-gray-800">{employee.first_name} {employee.last_name}</h1>
            <div className="flex gap-2">
              <div className="w-6 h-6 bg-red-600 rounded-full"></div>
              <div className="w-6 h-6 bg-blue-400 rounded-sm"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm">
            <InfoRow label="Login ID" value={employee.login_id} />
            <InfoRow label="Company" value="EmPay" />
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Department" value={employee.department} />
            <InfoRow label="Mobile" value={employee.phone} />
            <InfoRow label="Manager" value={employee.manager_name || '-'} />
            <InfoRow label="Location" value={employee.address || '-'} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 px-10">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-6 py-4 font-medium text-sm transition-all relative",
              activeTab === tab ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-10">
        {activeTab === 'Resume' && <ResumeTab employee={employee} />}
        {activeTab === 'Private Info' && <PrivateTab employee={employee} />}
        {activeTab === 'Salary Info' && <SalaryTab employee={employee} />}
        {activeTab === 'Security' && <SecurityTab employee={employee} />}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="flex">
    <span className="w-24 text-gray-400 font-medium">{label}</span>
    <span className="text-gray-800 font-medium">{value}</span>
  </div>
);

const ResumeTab = ({ employee }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
    <div className="space-y-6">
      <div className="bg-[#f8f9fa] p-6 rounded border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">About</h3>
          <Edit2 className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {employee.about_text || 'No description provided.'}
        </p>
      </div>

      <div className="bg-[#f8f9fa] p-6 rounded border border-gray-200">
        <h3 className="font-bold text-gray-800 mb-4">What I love about my job</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {employee.interests_hobbies || 'Not specified.'}
        </p>
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-[#f8f9fa] p-6 rounded border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Skills</h3>
          <Plus className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
        <div className="text-sm text-gray-400 italic">+ Add Skills</div>
      </div>

      <div className="bg-[#f8f9fa] p-6 rounded border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Certification</h3>
          <Plus className="w-4 h-4 text-gray-400 cursor-pointer" />
        </div>
        <div className="text-sm text-gray-400 italic">+ Add Certification</div>
      </div>
    </div>
  </div>
);

const PrivateTab = ({ employee }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
    <Section title="Personal Information">
      <InfoItem label="Address" value={employee.private_address} />
      <InfoItem label="Date of Birth" value={employee.date_of_birth} />
      <InfoItem label="Place of Birth" value={employee.place_of_birth} />
      <InfoItem label="Government ID" value={employee.government_id} />
    </Section>
    <Section title="Family">
      <InfoItem label="Marital Status" value={employee.marital_status} />
      <InfoItem label="Dependents" value={employee.dependents} />
      <InfoItem label="Emergency Contact" value={employee.emergency_contact_name} />
    </Section>
  </div>
);

const SalaryTab = ({ employee }) => (
  <div className="space-y-6">
    <Section title="Salary Structure">
      <InfoItem label="Monthly Wage" value={`₹${employee.salary_structure?.monthly_wage || 0}`} />
      <InfoItem label="Wage Type" value={employee.salary_structure?.wage_type} />
    </Section>
  </div>
);

const SecurityTab = ({ employee }) => (
  <div className="max-w-md space-y-8">
    <div className="bg-[#f8f9fa] p-6 rounded border border-gray-200">
      <h3 className="font-bold text-gray-800 mb-6">Change Password</h3>
      <div className="space-y-4">
        <PasswordField label="Old Password" />
        <PasswordField label="New Password" />
        <PasswordField label="Confirm Password" />
        <button className="bg-blue-400 text-white px-6 py-2 rounded text-sm font-bold shadow-sm">
          Reset password
        </button>
      </div>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="space-y-4">
    <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-2">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="flex text-sm">
    <span className="w-32 text-gray-400">{label} :-</span>
    <span className="text-gray-800 font-medium">{value || '-'}</span>
  </div>
);

const PasswordField = ({ label }) => (
  <div>
    <label className="block text-sm text-gray-500 mb-1">{label}</label>
    <input type="password" title={label} className="w-full border-b border-gray-300 py-1 focus:outline-none focus:border-blue-400" />
  </div>
);
