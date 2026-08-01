import React from 'react';

const SUBJECTS = [
  'All',
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

export const SubjectFilter = ({ selectedSubject, onSelectSubject }) => {
  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
      {SUBJECTS.map((subject) => {
        const isSelected = selectedSubject === subject;
        return (
          <button
            key={subject}
            onClick={() => onSelectSubject(subject)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
              isSelected
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {subject}
          </button>
        );
      })}
    </div>
  );
};

export default SubjectFilter;
