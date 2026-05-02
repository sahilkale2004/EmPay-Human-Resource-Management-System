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

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between border-b border-gray-300 pb-4">
         <h1 className="text-xl font-bold text-gray-800">Reports</h1>
         <div className="flex gap-2">
            <div className="w-6 h-6 bg-red-600 rounded-full"></div>
            <div className="w-6 h-6 bg-blue-400 rounded-sm"></div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((rpt) => (
          <div 
            key={rpt.id} 
            onClick={() => setSelectedReport(rpt.id)}
            className="bg-white border border-gray-300 p-6 rounded shadow-sm cursor-pointer hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
              <FileText className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">{rpt.name}</h3>
            <p className="text-xs text-gray-500">{rpt.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const SalaryAttachmentReport = ({ onBack }) => (
  <div className="space-y-6 font-sans max-w-5xl mx-auto pb-20">
    <div className="flex justify-between items-center bg-white p-4 border border-gray-300 rounded shadow-sm">
      <button onClick={onBack} className="text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm font-bold uppercase">
        <Download className="w-4 h-4" /> Download
      </button>
      <h2 className="font-bold text-gray-800 uppercase tracking-widest text-sm text-center">Salary Attachment Report (Draft)</h2>
      <button className="text-gray-500 hover:text-gray-800 flex items-center gap-2 text-sm font-bold uppercase">
        <Printer className="w-4 h-4" /> Print
      </button>
    </div>

    <div className="bg-white border border-gray-300 p-12 rounded shadow-sm space-y-10">
       <div className="text-center">
          <h1 className="text-xl font-bold text-primary uppercase underline">Salary Attachment Report</h1>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">Period: October 2025</p>
       </div>

       <table className="w-full text-xs text-left border-collapse border border-gray-200">
          <thead>
             <tr className="bg-gray-100 uppercase tracking-wider">
                <th className="border border-gray-200 p-3">Component</th>
                <th className="border border-gray-200 p-3 text-right">Debit</th>
                <th className="border border-gray-200 p-3 text-right">Credit</th>
             </tr>
          </thead>
          <tbody>
             <tr className="font-bold bg-gray-50"><td colSpan={3} className="border border-gray-200 p-2 text-primary">Earnings</td></tr>
             <tr>
                <td className="border border-gray-200 p-3">Basic Salary</td>
                <td className="border border-gray-200 p-3 text-right">₹12,00,000</td>
                <td className="border border-gray-200 p-3 text-right">₹12,00,000</td>
             </tr>
             <tr>
                <td className="border border-gray-200 p-3">Allowances</td>
                <td className="border border-gray-200 p-3 text-right">₹4,50,000</td>
                <td className="border border-gray-200 p-3 text-right">₹4,50,000</td>
             </tr>
             <tr className="font-bold bg-gray-50"><td colSpan={3} className="border border-gray-200 p-2 text-red-600">Deductions</td></tr>
             <tr>
                <td className="border border-gray-200 p-3">Provident Fund</td>
                <td className="border border-gray-200 p-3 text-right">₹1,20,000</td>
                <td className="border border-gray-200 p-3 text-right">₹1,20,000</td>
             </tr>
             <tr className="font-bold bg-primary text-white">
                <td className="border border-gray-200 p-3">Net Salary</td>
                <td className="border border-gray-200 p-3 text-right">₹15,30,000</td>
                <td className="border border-gray-200 p-3 text-right">₹15,30,000</td>
             </tr>
          </tbody>
       </table>
    </div>
  </div>
);
