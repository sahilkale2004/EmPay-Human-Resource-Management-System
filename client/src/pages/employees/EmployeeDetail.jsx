import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Edit2, Mail, Phone, MapPin, 
  Shield, CreditCard, Lock, User, Camera, X, Save,
  AlertCircle, ChevronRight, CheckCircle2, TrendingUp, Loader2
} from 'lucide-react';
import clsx from 'clsx';
import PasswordInput from '../../components/ui/PasswordInput';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const EmployeeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('Resume');
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const isAdminOrHR = ['ADMIN', 'HR_OFFICER'].includes(user?.role);
  const isPayroll = user?.role === 'PAYROLL_OFFICER';
  const isSelf = parseInt(user?.employee_id) === parseInt(id);
  const canEditAny = isAdminOrHR;
  const canEditThis = isAdminOrHR || isSelf;

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/employees/${id}`);
      if (res.data.success) {
        setEmployee(res.data.data);
        setFormData(res.data.data);
        setPreviewImage(null);
        setSelectedFile(null);
      }
    } catch (err) {
      toast.error('Failed to load employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size exceeds 2MB');
        return;
      }
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.type)) {
        toast.error('Only JPG, PNG and WEBP are allowed');
        return;
      }
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(employee);
    setPreviewImage(null);
    setSelectedFile(null);
    setFormError('');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to terminate ${employee.first_name} ${employee.last_name}? This will archive their profile and revoke system access.`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await api.delete(`/employees/${id}`);
      if (res.data.success) {
        toast.success('Employee terminated successfully');
        navigate('/employees');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to terminate employee');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setFormError('');
    try {
      const changedFields = new FormData();
      let hasChanges = false;

      // Diff fields
      Object.keys(formData).forEach(key => {
        if (key === 'salary_structure') return;
        if (formData[key] !== employee[key]) {
          changedFields.append(key, formData[key] === null ? '' : formData[key]);
          hasChanges = true;
        }
      });

      if (selectedFile) {
        changedFields.append('profile_picture', selectedFile);
        hasChanges = true;
      }

      if (!hasChanges) {
        setEditMode(false);
        return;
      }

      const res = await api.put(`/employees/${id}`, changedFields, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Profile updated successfully');
        setEmployee(res.data.data);
        setFormData(res.data.data);
        setEditMode(false);
        setPreviewImage(null);
        setSelectedFile(null);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to update profile');
      toast.error('Update failed');
    }
  };

  if (loading) return (
    <div className="p-20 text-center space-y-4">
      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
      <p className="text-muted font-bold tracking-widest uppercase text-[10px]">Synchronizing Profile...</p>
    </div>
  );
  if (!employee) return <div className="p-10 text-center text-error font-bold">Error: Employee records not accessible.</div>;

  const tabs = ['Resume', 'Private Info', 'Salary Info', 'Security'];

  return (
    <div className="bg-surface min-h-screen pb-20">
      {/* Dynamic Header */}
      <div className="bg-white border-b border-border sticky top-14 z-30 px-10 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-text">{employee.first_name} {employee.last_name}</h2>
            <p className="text-[10px] font-bold text-muted uppercase tracking-wider">{employee.job_position || 'Staff'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {editMode ? (
            <>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
              >
                <Save className="w-4 h-4" /> Save Record
              </button>
              <button 
                onClick={handleCancel}
                className="flex items-center gap-2 bg-white text-muted px-6 py-2.5 rounded-xl text-sm font-bold border border-border hover:bg-surface transition-all active:scale-95"
              >
                <X className="w-4 h-4" /> Discard
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {isAdminOrHR && !isSelf && (
                <button 
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-error/10 text-error px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-error hover:text-white transition-all active:scale-95 border border-error/20"
                >
                  <X className="w-4 h-4" /> Terminate
                </button>
              )}
              {canEditThis && (
                <button 
                  onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 bg-sidebar text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/10 active:scale-95"
                >
                  <Edit2 className="w-4 h-4" /> Modify Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-10 pt-10 space-y-10">
        {formError && (
          <div className="p-4 bg-error/5 border border-error/20 text-error rounded-2xl flex items-start gap-3 animate-notif-pop">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-bold">{formError}</p>
          </div>
        )}

        {/* Profile Info Card */}
        <div className="bg-card border border-border rounded-[2rem] p-10 shadow-sm flex flex-col lg:flex-row gap-12 relative overflow-hidden">
          <div className="relative group shrink-0">
            <div className="w-48 h-48 rounded-[2.5rem] bg-surface flex items-center justify-center overflow-hidden border-4 border-white shadow-2xl relative z-10">
              {previewImage || employee.profile_picture ? (
                <img 
                  src={previewImage || `${API_BASE_URL}${employee.profile_picture}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-20 h-20 text-muted/20" />
              )}
            </div>
            {editMode && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-primary/60 rounded-[2.5rem] z-20 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm"
              >
                <Camera className="w-8 h-8 mb-2 animate-bounce" />
                <span className="text-[10px] font-black uppercase tracking-widest">Update Photo</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl"></div>
          </div>

          <div className="flex-1 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1">
                {editMode ? (
                  <div className="flex gap-4">
                    <input name="first_name" value={formData.first_name || ''} onChange={handleInputChange} className="text-4xl font-bold text-text bg-transparent border-b-2 border-primary outline-none w-48" />
                    <input name="last_name" value={formData.last_name || ''} onChange={handleInputChange} className="text-4xl font-bold text-text bg-transparent border-b-2 border-primary outline-none w-48" />
                  </div>
                ) : (
                  <h1 className="text-4xl font-bold text-text tracking-tight">
                    {employee.first_name} <span className="text-primary">{employee.last_name}</span>
                  </h1>
                )}
                <p className="text-muted font-bold tracking-[0.3em] uppercase text-xs pl-1">Empowerment ID: {employee.login_id}</p>
              </div>
              <div className="px-4 py-2 bg-success/10 text-success rounded-full text-[10px] font-black uppercase tracking-widest border border-success/20 flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                Account Active
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4 border-t border-border/50">
              <HeaderInfoItem label="Email Address" value={employee.email} icon={Mail} isLocked />
              <HeaderInfoItem 
                label="Current Role" 
                name="role" 
                value={formData.role} 
                icon={Shield} 
                isLocked={!isAdminOrHR} 
                editMode={editMode} 
                onChange={handleInputChange} 
                type="select" 
                options={['ADMIN', 'HR_OFFICER', 'PAYROLL_OFFICER', 'EMPLOYEE']} 
              />
              <HeaderInfoItem 
                label="Department" 
                name="department" 
                value={formData.department} 
                icon={TrendingUp} 
                isLocked={!isAdminOrHR} 
                editMode={editMode} 
                onChange={handleInputChange} 
              />
              <HeaderInfoItem 
                label="Position" 
                name="job_position" 
                value={formData.job_position} 
                icon={User} 
                isLocked={!isAdminOrHR} 
                editMode={editMode} 
                onChange={handleInputChange} 
              />
              <HeaderInfoItem 
                label="Mobile Phone" 
                name="phone" 
                value={formData.phone} 
                icon={Phone} 
                editMode={editMode} 
                onChange={handleInputChange} 
              />
              <HeaderInfoItem 
                label="Work Location" 
                name="address" 
                value={formData.address} 
                icon={MapPin} 
                editMode={editMode} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
        </div>

        {/* Tabbed Navigation */}
        <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
          <div className="flex border-b border-border px-10 bg-surface/30">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  "px-8 py-5 font-bold text-xs uppercase tracking-widest transition-all relative",
                  activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted hover:text-text"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-10 min-h-[400px]">
            {activeTab === 'Resume' && <ResumeTab employee={employee} editMode={editMode} formData={formData} onChange={handleInputChange} />}
            {activeTab === 'Private Info' && <PrivateTab employee={employee} editMode={editMode} formData={formData} onChange={handleInputChange} isSelf={isSelf} isAdminOrHR={isAdminOrHR} />}
            {activeTab === 'Salary Info' && <SalaryTab employeeId={id} isSelf={isSelf} currentUser={user} />}
            {activeTab === 'Security' && <SecurityTab employee={employee} isSelf={isSelf} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const HeaderInfoItem = ({ label, name, value, icon: Icon, isLocked, editMode, onChange, type = 'text', options = [] }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      <div className="p-1.5 bg-surface rounded-lg">
        <Icon className="w-3 h-3 text-muted" />
      </div>
      <span className="text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1">
        {label} {isLocked && <Lock className="w-2.5 h-2.5 opacity-50" />}
      </span>
    </div>
    {editMode && !isLocked ? (
      type === 'select' ? (
        <select 
          name={name} value={value || ''} onChange={onChange}
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm font-bold focus:border-primary outline-none"
        >
          <option value="">Select Role...</option>
          {options.map(opt => <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>)}
        </select>
      ) : (
        <input 
          type={type} name={name} value={value || ''} onChange={onChange}
          className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm font-bold focus:border-primary outline-none"
        />
      )
    ) : (
      <p className={clsx("text-sm font-bold truncate pl-1", isLocked ? "text-muted" : "text-text")}>
        {value || 'Not specified'}
      </p>
    )}
  </div>
);

const LockBanner = ({ message }) => (
  <div className="mb-8 p-4 bg-[#FFF8E1] border border-[#FFB300] rounded-2xl flex items-center gap-4 text-[#795548]">
    <div className="p-2 bg-white/50 rounded-full shadow-sm">
      <Lock className="w-5 h-5 text-[#FFB300]" />
    </div>
    <p className="text-sm font-bold italic">{message}</p>
  </div>
);

const Section = ({ title, children, icon: Icon }) => (
  <div className="space-y-6">
    <h3 className="text-sm font-black text-text uppercase tracking-[0.2em] flex items-center gap-3">
      {Icon && <Icon className="w-4 h-4 text-primary" />}
      {title}
    </h3>
    <div className="space-y-4">{children}</div>
  </div>
);

const InfoItem = ({ label, name, value, isLocked, editMode, onChange, type = 'text', options = [] }) => (
  <div className="flex items-center py-3 border-b border-border/40 last:border-0 group">
    <span className="w-48 text-[10px] font-black text-muted uppercase tracking-widest flex items-center gap-1">
      {label} {isLocked && <Lock className="w-3 h-3 opacity-30" />}
    </span>
    <div className="flex-1">
      {editMode && !isLocked ? (
        type === 'select' ? (
          <select name={name} value={value || ''} onChange={onChange} className="w-full max-w-md bg-surface border border-border rounded-lg px-3 py-1.5 text-sm font-bold focus:border-primary outline-none transition-all">
            <option value="">Select...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input type={type} name={name} value={value || ''} onChange={onChange} className="w-full max-w-md bg-surface border border-border rounded-lg px-3 py-1.5 text-sm font-bold focus:border-primary outline-none transition-all" />
        )
      ) : (
        <span className={clsx("text-sm font-bold", isLocked ? "text-muted/60" : "text-text")}>
          {value || '—'}
        </span>
      )}
    </div>
  </div>
);

const ResumeTab = ({ employee, editMode, formData, onChange }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
    <Section title="Professional Bio">
      {editMode ? (
        <textarea name="about_text" value={formData.about_text || ''} onChange={onChange} className="w-full min-h-[160px] p-6 bg-surface border border-border rounded-3xl text-sm font-bold focus:border-primary outline-none italic" placeholder="Write something inspiring..." />
      ) : (
        <p className="text-sm text-text-soft leading-relaxed italic bg-surface/50 p-6 rounded-3xl border border-dashed border-border">
          {employee.about_text || 'No professional bio provided yet.'}
        </p>
      )}
    </Section>
    <div className="space-y-12">
      <Section title="Passions & Interests">
        {editMode ? (
          <textarea name="interests_hobbies" value={formData.interests_hobbies || ''} onChange={onChange} className="w-full min-h-[100px] p-6 bg-surface border border-border rounded-3xl text-sm font-bold focus:border-primary outline-none" placeholder="What keeps you motivated?" />
        ) : (
          <p className="text-sm text-text-soft font-medium bg-surface/30 p-6 rounded-3xl border border-border">
            {employee.interests_hobbies || 'Not specified.'}
          </p>
        )}
      </Section>
      <Section title="Valid Certifications">
        {editMode ? (
          <textarea name="certifications" value={formData.certifications || ''} onChange={onChange} className="w-full min-h-[100px] p-6 bg-surface border border-border rounded-3xl text-sm font-bold focus:border-primary outline-none" placeholder="List your professional milestones..." />
        ) : (
          <p className="text-sm text-text-soft font-medium bg-surface/30 p-6 rounded-3xl border border-border">
            {employee.certifications || 'No certifications added.'}
          </p>
        )}
      </Section>
    </div>
  </div>
);

const PrivateTab = ({ employee, editMode, formData, onChange, isSelf, isAdminOrHR }) => {
  const isLocked = !isSelf && isAdminOrHR;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {isLocked && <LockBanner message="Private information is confidential and can only be edited by the employee themselves." />}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        <Section title="Identity & Identity">
          <InfoItem label="Legal Address" name="private_address" value={formData.private_address} editMode={editMode} onChange={onChange} isLocked={isLocked} />
          <InfoItem label="Birth Date" name="date_of_birth" value={formData.date_of_birth} editMode={editMode} onChange={onChange} type="date" isLocked={isLocked} />
          <InfoItem label="Birth Place" name="place_of_birth" value={formData.place_of_birth} editMode={editMode} onChange={onChange} isLocked={isLocked} />
          <InfoItem label="Nationality" name="nationality" value={formData.nationality} editMode={editMode} onChange={onChange} isLocked={isLocked} />
          <InfoItem label="Gender Identity" name="gender" value={formData.gender} editMode={editMode} onChange={onChange} type="select" options={['MALE', 'FEMALE', 'OTHER']} isLocked={isLocked} />
        </Section>
        <Section title="Family & Emergency">
          <InfoItem label="Government UID" name="government_id" value={formData.government_id} editMode={editMode} onChange={onChange} isLocked={isLocked} />
          <InfoItem label="Marital Status" name="marital_status" value={formData.marital_status} editMode={editMode} onChange={onChange} type="select" options={['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']} isLocked={isLocked} />
          <InfoItem label="Dependents Count" name="dependents" value={formData.dependents} editMode={editMode} onChange={onChange} type="number" isLocked={isLocked} />
          <InfoItem label="Emergency Point" name="emergency_contact_name" value={formData.emergency_contact_name} editMode={editMode} onChange={onChange} isLocked={isLocked} />
          <InfoItem label="Emergency Contact" name="emergency_contact_phone" value={formData.emergency_contact_phone} editMode={editMode} onChange={onChange} isLocked={isLocked} />
        </Section>
        <Section title="Financial Repository">
          <InfoItem label="Primary Bank" name="bank_name" value={formData.bank_name} editMode={editMode} onChange={onChange} isLocked={!isAdminOrHR && !isSelf} />
          <InfoItem label="Account Ident" name="bank_account_number" value={formData.bank_account_number} editMode={editMode} onChange={onChange} isLocked={!isAdminOrHR && !isSelf} />
          <InfoItem label="Branch Routing" name="ifsc_code" value={formData.ifsc_code} editMode={editMode} onChange={onChange} isLocked={!isAdminOrHR && !isSelf} />
        </Section>
      </div>
    </div>
  );
};

const SalaryTab = ({ employeeId, isSelf, currentUser }) => {
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const isAdminOrPayroll = ['ADMIN', 'PAYROLL_OFFICER'].includes(currentUser?.role);

  useEffect(() => {
    fetchSalary();
  }, [employeeId]);

  const fetchSalary = async () => {
    try {
      const res = await api.get(`/employees/${employeeId}/salary`);
      if (res.data.success) {
        setSalary(res.data.data);
        if (res.data.data) {
          // Calculate percentages from stored amounts for UI
          const s = res.data.data;
          const monthly = Number(s.monthly_wage);
          const basic = Number(s.basic_pct);
          const basicAmt = monthly * (basic / 100);
          
          setEditData({
            ...s,
            standard_allowance_pct: (Number(s.standard_allowance) / monthly * 100).toFixed(2),
            performance_bonus_pct: (Number(s.performance_bonus) / monthly * 100).toFixed(2),
            travel_allowance_pct: (Number(s.travel_allowance) / monthly * 100).toFixed(2),
            food_allowance_pct: (Number(s.food_allowance) / monthly * 100).toFixed(2),
          });
        }
      }
    } catch (err) {
      toast.error('Failed to load salary info');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await api.post(`/employees/${employeeId}/salary`, editData);
      if (res.data.success) {
        toast.success('Salary structure updated');
        setSalary(res.data.data);
        setIsEditing(false);
        fetchSalary();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save salary');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const totals = useMemo(() => {
    const monthly = Number(editData.monthly_wage) || 0;
    const basicPct = Number(editData.basic_pct) || 0;
    const basicAmt = monthly * (basicPct / 100);
    
    const hraPct = Number(editData.hra_pct) || 0;
    const hraAmt = basicAmt * (hraPct / 100);

    const stdPct = Number(editData.standard_allowance_pct) || 0;
    const perfPct = Number(editData.performance_bonus_pct) || 0;
    const travelPct = Number(editData.travel_allowance_pct) || 0;
    const foodPct = Number(editData.food_allowance_pct) || 0;

    const stdAmt = monthly * (stdPct / 100);
    const perfAmt = monthly * (perfPct / 100);
    const travelAmt = monthly * (travelPct / 100);
    const foodAmt = monthly * (foodPct / 100);

    const totalPct = basicPct + stdPct + perfPct + travelPct + foodPct;
    const grossAmt = basicAmt + hraAmt + stdAmt + perfAmt + travelAmt + foodAmt;

    const pfPct = Number(editData.pf_pct || 12);
    const pfAmt = basicAmt * (pfPct / 100);
    const ptAmt = 200;
    const netAmt = monthly - pfAmt - ptAmt;

    return { totalPct, grossAmt, basicAmt, hraAmt, stdAmt, perfAmt, travelAmt, foodAmt, pfAmt, ptAmt, netAmt };
  }, [editData]);

  if (loading) return <div className="animate-pulse py-10 text-center text-muted font-bold tracking-widest text-[10px]">Accessing Vault...</div>;

  if (!salary && !isEditing) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-surface/50 rounded-[2.5rem] border border-dashed border-border">
        <CreditCard className="w-16 h-16 text-muted/20" />
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-text">No salary structure defined.</h3>
          <p className="text-sm text-muted max-w-xs font-medium">This employee does not have a verified payroll configuration yet.</p>
        </div>
        {isAdminOrPayroll && (
          <button 
            onClick={() => {
              setEditData({ wage_type: 'MONTHLY', monthly_wage: 0, basic_pct: 40, hra_pct: 50, pf_pct: 12, professional_tax: 200 });
              setIsEditing(true);
            }}
            className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            Create Structure
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-text flex items-center gap-3">
          <div className="w-1.5 h-7 bg-primary rounded-full"></div>
          Payroll Configuration
        </h3>
        {isAdminOrPayroll && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-sidebar text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-primary transition-all active:scale-95"
          >
            <Edit2 className="w-3 h-3" /> Edit Configuration
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <Section title="General Terms">
               <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-3xl border border-border">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Wage Type</label>
                    <div className="flex gap-4">
                      {['MONTHLY', 'HOURLY'].map(t => (
                        <button 
                          key={t}
                          onClick={() => setEditData(prev => ({...prev, wage_type: t}))}
                          className={clsx("px-4 py-2 rounded-xl text-xs font-bold transition-all border", 
                            editData.wage_type === t ? "bg-primary text-white border-primary" : "bg-surface text-muted border-border hover:border-muted")}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Monthly Wage (₹)</label>
                    <input name="monthly_wage" type="number" value={editData.monthly_wage} onChange={handleChange} className="w-full bg-surface border border-border rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-primary" />
                    <p className="text-[10px] text-muted font-bold italic">Yearly: ₹{(Number(editData.monthly_wage)*12).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-muted uppercase tracking-widest">Effective From</label>
                    <input name="effective_from" type="date" value={editData.effective_from ? editData.effective_from.split('T')[0] : ''} onChange={handleChange} className="w-full bg-surface border border-border rounded-xl px-4 py-2 font-bold text-sm outline-none focus:border-primary" />
                  </div>
               </div>
            </Section>

            <Section title="Earnings Components">
               <div className="bg-white rounded-3xl border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-surface/50 border-b border-border">
                      <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-widest">Component</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-muted uppercase tracking-widest">% of Wage</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-muted uppercase tracking-widest">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-bold">
                      <EarningsRow label="Basic Salary" name="basic_pct" value={editData.basic_pct} amount={totals.basicAmt} onChange={handleChange} />
                      <EarningsRow label="House Rent (HRA)" name="hra_pct" value={editData.hra_pct} amount={totals.hraAmt} onChange={handleChange} subtext="% of Basic" />
                      <EarningsRow label="Standard Allowance" name="standard_allowance_pct" value={editData.standard_allowance_pct} amount={totals.stdAmt} onChange={handleChange} />
                      <EarningsRow label="Performance Bonus" name="performance_bonus_pct" value={editData.performance_bonus_pct} amount={totals.perfAmt} onChange={handleChange} />
                      <EarningsRow label="Travel Allowance" name="travel_allowance_pct" value={editData.travel_allowance_pct} amount={totals.travelAmt} onChange={handleChange} />
                      <EarningsRow label="Food Allowance" name="food_allowance_pct" value={editData.food_allowance_pct} amount={totals.foodAmt} onChange={handleChange} />
                      <tr className="bg-primary/5">
                        <td className="px-6 py-4">Total Earnings</td>
                        <td className={clsx("px-6 py-4", totals.totalPct > 100 ? "text-error" : "text-primary")}>{totals.totalPct.toFixed(1)}%</td>
                        <td className="px-6 py-4 text-right">₹{totals.grossAmt.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                      </tr>
                    </tbody>
                  </table>
                  {totals.totalPct > 100 && (
                    <div className="p-3 bg-error/10 text-error text-[10px] font-black text-center uppercase tracking-widest">
                      ⚠️ Total components exceed 100% of gross wage
                    </div>
                  )}
               </div>
            </Section>
          </div>

          <div className="space-y-8">
            <Section title="Mandatory Deductions">
               <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-border/50">
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">PF (Employee)</p>
                      <p className="text-xs font-bold text-text-soft mt-1">12% of Basic</p>
                    </div>
                    <p className="text-sm font-bold text-error">- ₹{totals.pfAmt.toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border/50">
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">Professional Tax</p>
                      <p className="text-xs font-bold text-text-soft mt-1">Government Mandated</p>
                    </div>
                    <p className="text-sm font-bold text-error">- ₹{totals.ptAmt}</p>
                  </div>
                  
                  <div className="bg-success/5 p-6 rounded-3xl border border-success/20 space-y-2">
                    <p className="text-[10px] font-black text-success uppercase tracking-widest">Estimated Monthly Take-home</p>
                    <p className="text-3xl font-bold text-success leading-none mt-2">₹{Math.max(0, totals.netAmt).toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={handleSave} 
                      disabled={totals.totalPct > 100}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50"
                    >
                      Commit Structure
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      className="px-6 bg-surface text-muted rounded-2xl font-bold border border-border hover:bg-white transition-all"
                    >
                      Cancel
                    </button>
                  </div>
               </div>
            </Section>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <Section title="Structure Summary" icon={TrendingUp}>
            <SummaryItem label="Wage Type" value={salary.wage_type} />
            <SummaryItem label="Gross Monthly" value={`₹${Number(salary.monthly_wage).toLocaleString()}`} highlight />
            <SummaryItem label="Basic Component" value={`₹${Number(salary.basic_pct * salary.monthly_wage / 100).toLocaleString()} (${salary.basic_pct}%)`} />
            <SummaryItem label="Effective Date" value={new Date(salary.effective_from).toLocaleDateString()} />
          </Section>
          <Section title="Allowances" icon={CheckCircle2}>
            <SummaryItem label="HRA" value={`₹${Number(salary.basic_pct * salary.monthly_wage / 100 * salary.hra_pct / 100).toLocaleString()}`} />
            <SummaryItem label="Standard" value={`₹${Number(salary.standard_allowance).toLocaleString()}`} />
            <SummaryItem label="Performance" value={`₹${Number(salary.performance_bonus).toLocaleString()}`} />
            <SummaryItem label="Travel/Food" value={`₹${(Number(salary.travel_allowance) + Number(salary.food_allowance)).toLocaleString()}`} />
          </Section>
          <Section title="Social Security" icon={Shield}>
             <div className="bg-primary/5 p-6 rounded-3xl space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-soft">EPF Contribution</span>
                  <span className="text-sm font-bold text-error">₹{Number(salary.basic_pct * salary.monthly_wage / 100 * salary.pf_pct / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-soft">Professional Tax</span>
                  <span className="text-sm font-bold text-error">₹{salary.professional_tax}</span>
                </div>
                <div className="pt-4 border-t border-primary/20 flex justify-between items-center">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">Est. Net Pay</span>
                  <span className="text-lg font-bold text-primary">₹{(salary.monthly_wage - (salary.basic_pct * salary.monthly_wage / 100 * salary.pf_pct / 100) - salary.professional_tax).toLocaleString()}</span>
                </div>
             </div>
          </Section>
        </div>
      )}
    </div>
  );
};

const EarningsRow = ({ label, name, value, amount, onChange, subtext }) => (
  <tr>
    <td className="px-6 py-4">
      <div>{label}</div>
      {subtext && <div className="text-[9px] text-muted-500 italic lowercase">{subtext}</div>}
    </td>
    <td className="px-6 py-4">
      <div className="flex items-center gap-1">
        <input name={name} type="number" value={value} onChange={onChange} className="w-16 bg-surface/50 border border-border rounded px-2 py-1 text-center" />
        <span className="text-muted">%</span>
      </div>
    </td>
    <td className="px-6 py-4 text-right text-text-soft">₹{amount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
  </tr>
);

const SummaryItem = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-3 border-b border-border/40 last:border-0">
    <span className="text-[10px] font-black text-muted uppercase tracking-widest">{label}</span>
    <span className={clsx("text-sm font-bold", highlight ? "text-primary" : "text-text")}>{value}</span>
  </div>
);

const SecurityTab = ({ employee, isSelf }) => {
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPassForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/auth/change-password', {
        oldPassword: passForm.oldPassword,
        newPassword: passForm.newPassword
      });
      if (res.data.success) {
        toast.success('Password updated successfully');
        setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md animate-fade-in mx-auto">
      {!isSelf && <LockBanner message="Password management is restricted to the account owner only." />}
      
      <div className="bg-white p-10 rounded-[2.5rem] border border-border shadow-sm space-y-8">
        <div className="flex items-center gap-4 pb-6 border-b border-border">
          <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center text-primary">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-text leading-none">Security Center</h3>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1.5">Manage Access & Authentication</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface/50 p-4 rounded-xl border border-border">
            <label className="text-[10px] font-black text-muted uppercase tracking-widest block mb-1">Login Identity</label>
            <p className="text-sm font-bold text-text-soft flex items-center gap-2">
              <User className="w-4 h-4" /> {employee.login_id}
            </p>
          </div>

          {isSelf && (
            <form className="space-y-6 pt-4" onSubmit={handlePassSubmit}>
              <PasswordInput 
                label="Current Password" 
                name="oldPassword" 
                value={passForm.oldPassword}
                onChange={handlePassChange}
                placeholder="••••••••" 
                required
              />
              <PasswordInput 
                label="New Password" 
                name="newPassword" 
                value={passForm.newPassword}
                onChange={handlePassChange}
                placeholder="Minimum 6 characters" 
                required
              />
              <PasswordInput 
                label="Confirm New Password" 
                name="confirmPassword" 
                value={passForm.confirmPassword}
                onChange={handlePassChange}
                placeholder="Repeat new password" 
                required
              />
              
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/10 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {isSubmitting ? 'Updating Access...' : 'Update Security Code'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
