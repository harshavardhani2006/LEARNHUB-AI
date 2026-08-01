import React from 'react';

const SUBJECTS = [
  'Programming',
  'Database Management Systems',
  'Artificial Intelligence',
  'Web Development',
  'Data Structures',
  'Mathematics',
  'Science',
  'Interview Preparation',
  'Exam Notes'
];

export const UploadForm = ({
  title,
  setTitle,
  subject,
  setSubject,
  description,
  setDescription,
  errors = {}
}) => {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
          Document Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Python Basics - Variables & Loops"
          className={`w-full px-3 py-2 bg-white border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
            errors.title ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        />
        {errors.title && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.title}</p>
        )}
      </div>

      {/* Subject Dropdown */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
          Subject Category <span className="text-red-500">*</span>
        </label>
        <select
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={`w-full px-3 py-2 bg-white border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
            errors.subject ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
          }`}
        >
          <option value="">Select a subject...</option>
          {SUBJECTS.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
        {errors.subject && (
          <p className="text-red-500 text-xs mt-1 font-medium">{errors.subject}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of what this document covers (max 500 characters)..."
          maxLength={500}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
        />
      </div>
    </div>
  );
};

export default UploadForm;
