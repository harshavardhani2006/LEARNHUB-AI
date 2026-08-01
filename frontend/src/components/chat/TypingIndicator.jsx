import React from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex space-x-3 max-w-xs mr-auto justify-start items-center">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ai-purple to-accent-cyan flex items-center justify-center text-white shrink-0 shadow-sm border border-purple-100">
        <Bot className="w-4.5 h-4.5" />
      </div>

      {/* 3-dot pulse bubble */}
      <div className="bg-slate-100 border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5 h-9">
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
