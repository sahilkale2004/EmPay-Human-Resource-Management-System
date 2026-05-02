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
    <div className="bg-[#FDFBF8] min-h-screen rounded-2xl border border-[#DDD8CF] overflow-hidden">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start gap-8 p-8 border-b border-[#DDD8CF] bg-[#F5F2ED]">
        <div className="relative">
          <div className="w-36 h-36 bg-[#5C7A5F]/10 rounded-2xl flex items-center justify-center text-[#5C7A5F] border border-[#5C7A5F]/20">
            <span className="text-5xl font-bold">{employee.first_name[0]}{employee.last_name[0]}</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-[#2A2520]">{employee.first_name} {employee.last_name}</h1>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 bg-[#B84040] rounded-full"></div>
              <div className="w-2.5 h-2.5 bg-[#5C7A5F] rounded-full"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-[#5C7A5F]/10 text-[#3F5C42] rounded-full text-xs font-bold uppercase tracking-wide">{employee.role?.replace('_', ' ')}</span>
            {employee.department && <span className="px-3 py-1 bg-[#8B7355]/10 text-[#6B5132] rounded-full text-xs font-medium">{employee.department}</span>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5 text-sm mt-2">
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
      <div className="flex border-b border-[#DDD8CF] px-8 bg-[#FDFBF8]">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-5 py-4 font-medium text-sm transition-all relative border-b-2 -mb-px",
              activeTab === tab ? "text-[#5C7A5F] border-[#5C7A5F]" : "text-[#9C9286] border-transparent hover:text-[#6B6259]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-8">
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
    <span className="w-24 text-[#9C9286] font-medium text-xs">{label}</span>
    <span className="text-[#2A2520] font-semibold text-sm">{value}</span>
  </div>
);

const ResumeTab = ({ employee }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <div className="space-y-5">
      <div className="bg-[#F5F2ED] p-6 rounded-xl border border-[#DDD8CF]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#2A2520] text-sm">About</h3>
          <Edit2 className="w-4 h-4 text-[#9C9286] cursor-pointer hover:text-[#5C7A5F] transition-colors" />
        </div>
        <p className="text-sm text-[#6B6259] leading-relaxed">
          {employee.about_text || 'No description provided.'}
        </p>
      </div>

      <div className="bg-[#F5F2ED] p-6 rounded-xl border border-[#DDD8CF]">
        <h3 className="font-bold text-[#2A2520] text-sm mb-3">What I love about my job</h3>
        <p className="text-sm text-[#6B6259] leading-relaxed">
          {employee.interests_hobbies || 'Not specified.'}
        </p>
      </div>
    </div>

    <div className="space-y-5">
      <div className="bg-[#F5F2ED] p-6 rounded-xl border border-[#DDD8CF]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#2A2520] text-sm">Skills</h3>
          <Plus className="w-4 h-4 text-[#9C9286] cursor-pointer hover:text-[#5C7A5F] transition-colors" />
        </div>
        <div className="text-sm text-[#9C9286] italic">+ Add Skills</div>
      </div>

      <div className="bg-[#F5F2ED] p-6 rounded-xl border border-[#DDD8CF]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-[#2A2520] text-sm">Certification</h3>
          <Plus className="w-4 h-4 text-[#9C9286] cursor-pointer hover:text-[#5C7A5F] transition-colors" />
        </div>
        <div className="text-sm text-[#9C9286] italic">+ Add Certification</div>
      </div>
    </div>
  </div>
);

const PrivateTab = ({ employee }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
  <div className="space-y-5">
    <Section title="Salary Structure">
      <InfoItem label="Monthly Wage" value={`₹${employee.salary_structure?.monthly_wage || 0}`} />
      <InfoItem label="Wage Type" value={employee.salary_structure?.wage_type} />
    </Section>
  </div>
);

const SecurityTab = ({ employee }) => (
  <div className="max-w-md space-y-6">
    <div className="bg-[#F5F2ED] p-6 rounded-xl border border-[#DDD8CF]">
      <h3 className="font-bold text-[#2A2520] text-sm mb-5">Change Password</h3>
      <div className="space-y-4">
        <PasswordField label="Old Password" />
        <PasswordField label="New Password" />
        <PasswordField label="Confirm Password" />
        <button className="bg-[#5C7A5F] hover:bg-[#3F5C42] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all">
          Reset Password
        </button>
      </div>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h3 className="font-bold text-[#2A2520] text-sm border-b border-[#DDD8CF] pb-2">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="flex text-sm py-1">
    <span className="w-36 text-[#9C9286] font-medium">{label} :-</span>
    <span className="text-[#2A2520] font-semibold">{value || '-'}</span>
  </div>
);

const PasswordField = ({ label }) => (
  <div>
    <label className="block text-xs font-bold text-[#9C9286] uppercase tracking-wider mb-1.5">{label}</label>
    <input type="password" title={label} className="w-full bg-[#F5F2ED] border border-[#DDD8CF] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#5C7A5F] transition-colors" />
  </div>
);
