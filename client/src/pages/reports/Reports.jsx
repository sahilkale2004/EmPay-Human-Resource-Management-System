import React, { useState } from 'react';
import { FileText, Download, Printer, ChevronLeft, Search, Clock } from 'lucide-react';
import clsx from 'clsx';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);

  const reports = [
    { id: 'salary_attachment', name: 'Salary Attachment Report', description: 'Monthly salary breakdown for all employees.' },
    { id: 'attendance_report', name: 'Attendance Report', description: 'Daily attendance logs and work hours summary.' },
    { id: 'leave_report', name: 'Leave Report', description: 'Summary of approved and pending leave requests.' }
  ];

  if (selectedReport === 'salary_attachment') return <SalaryAttachmentReport onBack={() => setSelectedReport(null)} />;
  if (selectedReport === 'attendance_report') return <AttendanceReport onBack={() => setSelectedReport(null)} />;
  if (selectedReport === 'leave_report') return <LeaveReport onBack={() => setSelectedReport(null)} />;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div>
          <h1 className="text-2xl font-bold text-text">Reports</h1>
          <p className="text-muted text-xs font-bold uppercase tracking-widest mt-1">Generate and export HR insights</p>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((rpt) => (
          <div 
            key={rpt.id} 
            onClick={() => setSelectedReport(rpt.id)}
            className="bg-white border border-border p-8 rounded-[2.5rem] shadow-sm cursor-pointer hover:shadow-2xl transition-all duration-500 group relative overflow-hidden flex flex-col"
          >
            <div className="absolute top-[-10%] right-[-5%] w-20 h-20 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="w-14 h-14 bg-surface rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors shadow-inner">
              <FileText className="w-7 h-7 text-muted group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-bold text-text mb-3 text-base leading-tight">{rpt.name}</h3>
            <p className="text-xs text-text-soft leading-relaxed mb-6 flex-1">{rpt.description}</p>
            <div className="mt-auto flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
              View Report <span className="text-lg">→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SalaryAttachmentReport = ({ onBack }) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get('/payroll/report-summary');
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
        <FileText className="w-6 h-6 text-muted" />
      </div>
      <p className="text-muted text-xs font-bold uppercase tracking-widest">Compiling Data...</p>
    </div>
  );
  
  if (!data) return (
    <div className="p-20 text-center">
      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
        <Search className="w-6 h-6 text-muted" />
      </div>
      <p className="text-muted text-xs font-bold uppercase tracking-widest">No data available for this report.</p>
      <button onClick={onBack} className="mt-6 text-primary font-bold text-xs hover:underline">Return to Dashboard</button>
    </div>
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 animate-fade-in">
      <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-6 border border-border rounded-[2.5rem] shadow-xl sticky top-4 z-10">
        <button onClick={onBack} className="text-text-soft hover:text-primary flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:-translate-x-1">
          <ChevronLeft className="w-4 h-4" /> Back to reports
        </button>
        <h2 className="font-black text-text uppercase tracking-[0.3em] text-[10px]">Salary Attachment Report</h2>
        <div className="flex gap-2">
          <button className="p-3 bg-surface hover:bg-border/30 rounded-xl transition-all text-text-soft">
            <Printer className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-border p-16 rounded-[3rem] shadow-2xl space-y-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03]">
           <FileText className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="text-center relative">
          <div className="inline-block px-4 py-1.5 bg-primary/5 rounded-full text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-6">
            Official HR Document
          </div>
          <h1 className="text-4xl font-black text-text tracking-tight mb-3">Salary Attachment</h1>
          <p className="text-sm font-bold text-muted uppercase tracking-[0.2em]">Aggregate Payroll Summary</p>
          <div className="w-20 h-1 bg-primary mx-auto mt-8 rounded-full"></div>
        </div>

        <div className="overflow-hidden border border-border rounded-[2rem]">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-border">
                <th className="p-6 font-black text-muted text-[10px] uppercase tracking-widest">Financial Component</th>
                <th className="p-6 text-right font-black text-muted text-[10px] uppercase tracking-widest">Aggregate Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr className="bg-primary/[0.02]">
                <td colSpan={2} className="px-6 py-4 text-[10px] font-black text-primary uppercase tracking-[0.2em]">Earnings & Benefits</td>
              </tr>
              <tr>
                <td className="p-6 text-text font-bold">Basic Salary Pool</td>
                <td className="p-6 text-right text-text font-black text-lg">₹{parseFloat(data.total_basic || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td className="p-6 text-text font-bold">Allowances (HRA, TA, etc.)</td>
                <td className="p-6 text-right text-text font-black text-lg">₹{parseFloat(data.total_allowances || 0).toLocaleString()}</td>
              </tr>
              <tr className="bg-error/[0.02]">
                <td colSpan={2} className="px-6 py-4 text-[10px] font-black text-error uppercase tracking-[0.2em]">Statutory Deductions</td>
              </tr>
              <tr>
                <td className="p-6 text-text font-bold">Total Deductions (Tax, PF)</td>
                <td className="p-6 text-right text-error font-black text-lg">₹{parseFloat(data.total_deductions || 0).toLocaleString()}</td>
              </tr>
              <tr className="bg-text text-white">
                <td className="p-8 text-white font-black uppercase tracking-[0.2em] text-xs">Total Net Disbursement</td>
                <td className="p-8 text-right text-white font-black text-3xl tracking-tighter">₹{parseFloat(data.total_net || 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-12 border-t border-border flex justify-between items-center text-[10px] font-bold text-muted uppercase tracking-widest">
           <div>Generated on: {new Date().toLocaleDateString()}</div>
           <div>Secure EmPay Payroll System</div>
        </div>
      </div>
    </div>
  );
};

const AttendanceReport = ({ onBack }) => (
  <div className="p-20 text-center">
    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
      <Clock className="w-6 h-6 text-muted" />
    </div>
    <p className="text-muted text-xs font-bold uppercase tracking-widest">Attendance Report coming soon</p>
    <button onClick={onBack} className="mt-6 text-primary font-bold text-xs hover:underline flex items-center gap-2 mx-auto">
      <ChevronLeft className="w-3 h-3" /> Back to reports
    </button>
  </div>
);

const LeaveReport = ({ onBack }) => (
  <div className="p-20 text-center">
    <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
      <FileText className="w-6 h-6 text-muted" />
    </div>
    <p className="text-muted text-xs font-bold uppercase tracking-widest">Leave Report coming soon</p>
    <button onClick={onBack} className="mt-6 text-primary font-bold text-xs hover:underline flex items-center gap-2 mx-auto">
      <ChevronLeft className="w-3 h-3" /> Back to reports
    </button>
  </div>
);
