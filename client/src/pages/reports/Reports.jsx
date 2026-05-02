import React, { useState } from 'react';
import { FileText, Download, Printer } from 'lucide-react';
import clsx from 'clsx';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2A2520]">Reports</h1>
        <p className="text-[#6B6259] text-sm mt-0.5">Generate and export HR reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {reports.map((rpt) => (
          <div 
            key={rpt.id} 
            onClick={() => setSelectedReport(rpt.id)}
            className="bg-[#FDFBF8] border border-[#DDD8CF] p-6 rounded-2xl shadow-sm cursor-pointer hover:border-[#5C7A5F]/30 hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-[#F5F2ED] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#5C7A5F]/10 transition-colors">
              <FileText className="w-6 h-6 text-[#9C9286] group-hover:text-[#5C7A5F] transition-colors" />
            </div>
            <h3 className="font-bold text-[#2A2520] mb-2 text-sm">{rpt.name}</h3>
            <p className="text-xs text-[#9C9286] leading-relaxed">{rpt.description}</p>
            <div className="mt-4 text-[#5C7A5F] text-xs font-semibold group-hover:underline">View Report →</div>
          </div>
        ))}
      </div>
    </div>
  );
};

import api from '../../lib/api';
import toast from 'react-hot-toast';

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

  if (loading) return <div className="p-20 text-center italic text-gray-400">Loading Report...</div>;
  if (!data) return <div className="p-20 text-center italic text-gray-400">No data available for this report.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center bg-[#FDFBF8] p-4 border border-[#DDD8CF] rounded-2xl shadow-sm">
        <button onClick={onBack} className="text-[#6B6259] hover:text-[#2A2520] flex items-center gap-2 text-sm font-semibold transition-colors">
          <Download className="w-4 h-4" /> Download
        </button>
        <h2 className="font-bold text-[#2A2520] uppercase tracking-widest text-sm text-center">Salary Attachment Report</h2>
        <button className="text-[#6B6259] hover:text-[#2A2520] flex items-center gap-2 text-sm font-semibold transition-colors">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      <div className="bg-[#FDFBF8] border border-[#DDD8CF] p-12 rounded-2xl shadow-sm space-y-10">
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#5C7A5F] uppercase underline">Salary Attachment Report</h1>
          <p className="text-[10px] font-bold text-[#9C9286] mt-2 uppercase tracking-widest">Aggregate Data for Processed Payruns</p>
        </div>

        <table className="w-full text-xs text-left border-collapse border border-[#DDD8CF]">
          <thead>
            <tr className="bg-[#F5F2ED] uppercase tracking-wider">
              <th className="border border-[#DDD8CF] p-3 font-semibold text-[#6B6259]">Component</th>
              <th className="border border-[#DDD8CF] p-3 text-right font-semibold text-[#6B6259]">Total Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="font-bold bg-[#F5F2ED]"><td colSpan={2} className="border border-[#DDD8CF] p-2 text-[#5C7A5F]">Earnings</td></tr>
            <tr>
              <td className="border border-[#DDD8CF] p-3 text-[#2A2520]">Basic Salary</td>
              <td className="border border-[#DDD8CF] p-3 text-right text-[#6B6259]">₹{parseFloat(data.total_basic || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td className="border border-[#DDD8CF] p-3 text-[#2A2520]">Allowances (HRA, Travel, etc.)</td>
              <td className="border border-[#DDD8CF] p-3 text-right text-[#6B6259]">₹{parseFloat(data.total_allowances || 0).toLocaleString()}</td>
            </tr>
            <tr className="font-bold bg-[#F5F2ED]"><td colSpan={2} className="border border-[#DDD8CF] p-2 text-[#B84040]">Deductions</td></tr>
            <tr>
              <td className="border border-[#DDD8CF] p-3 text-[#2A2520]">Statutory Deductions (PF, Tax)</td>
              <td className="border border-[#DDD8CF] p-3 text-right text-[#6B6259]">₹{parseFloat(data.total_deductions || 0).toLocaleString()}</td>
            </tr>
            <tr className="font-bold bg-[#1C2B1E] text-white">
              <td className="border border-[#2E4232] p-3">Net Disbursement</td>
              <td className="border border-[#2E4232] p-3 text-right">₹{parseFloat(data.total_net || 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AttendanceReport = ({ onBack }) => (
  <div className="p-20 text-center italic text-gray-400">
    <button onClick={onBack} className="mb-8 text-blue-500 hover:underline">← Back</button>
    <p>Attendance Report Generation coming soon...</p>
  </div>
);

const LeaveReport = ({ onBack }) => (
  <div className="p-20 text-center italic text-gray-400">
    <button onClick={onBack} className="mb-8 text-blue-500 hover:underline">← Back</button>
    <p>Leave Report Generation coming soon...</p>
  </div>
);
