import React from 'react';

export const SuggestedQuestions = ({ questions, onClick }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-2 py-2">
      <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
        Suggested follow-up questions:
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <button
            key={index}
            onClick={() => onClick(question)}
            className="text-left text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 text-slate-655 font-medium px-3 py-1.5 rounded-full transition-all duration-150 active:scale-95"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
