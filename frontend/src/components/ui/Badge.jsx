import React from 'react';

const subjectColors = {
  'Programming': 'bg-blue-100 text-blue-700',
  'Database Management Systems': 'bg-purple-100 text-purple-700',
  'DBMS': 'bg-purple-100 text-purple-700',
  'Artificial Intelligence': 'bg-pink-100 text-pink-700',
  'AI': 'bg-pink-100 text-pink-700',
  'Web Development': 'bg-emerald-100 text-emerald-700',
  'Data Structures': 'bg-amber-100 text-amber-700',
  'Mathematics': 'bg-indigo-100 text-indigo-700',
  'Science': 'bg-teal-100 text-teal-700',
  'Interview Preparation': 'bg-red-100 text-red-700',
  'Interview Prep': 'bg-red-100 text-red-700',
  'Exam Notes': 'bg-fuchsia-100 text-fuchsia-700',
  'Default': 'bg-slate-100 text-slate-700'
};

const statusColors = {
  success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-100 text-amber-700 border border-amber-200',
  error: 'bg-red-100 text-red-700 border border-red-200',
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
  default: 'bg-slate-100 text-slate-700 border border-slate-200'
};

export const Badge = ({ children, subject, status, className = '' }) => {
  let colorClass = subjectColors.Default;

  if (subject) {
    colorClass = subjectColors[subject] || subjectColors.Default;
  } else if (status) {
    colorClass = statusColors[status] || statusColors.default;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}>
      {children}
    </span>
  );
};
