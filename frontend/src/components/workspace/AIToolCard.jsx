import React from 'react';
import { BookOpen, Award, Sparkles, FileText, Loader2 } from 'lucide-react';

const TOOL_ICONS = {
  summary: BookOpen,
  questions: Award,
  revision: Sparkles,
  diagram: FileText
};

const TOOL_COLORS = {
  summary: 'from-blue-500 to-indigo-600 text-blue-600 bg-blue-50',
  questions: 'from-amber-500 to-orange-600 text-amber-600 bg-amber-50',
  revision: 'from-purple-500 to-pink-600 text-purple-600 bg-purple-50',
  diagram: 'from-cyan-500 to-teal-600 text-cyan-600 bg-cyan-50'
};

export const AIToolCard = ({
  type, // 'summary' | 'questions' | 'revision' | 'diagram'
  title,
  description,
  active,
  loading,
  onClick
}) => {
  const Icon = TOOL_ICONS[type] || BookOpen;
  const colorClass = TOOL_COLORS[type] || 'from-slate-500 to-slate-600 text-slate-600 bg-slate-50';

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full text-left p-4 border rounded-card transition-all duration-300 flex items-start space-x-3.5 ${
        active
          ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
      } ${loading ? 'opacity-80 cursor-not-allowed' : 'active:scale-99'}`}
    >
      {/* Icon Badge */}
      <div className={`p-2.5 rounded-xl shrink-0 ${colorClass}`}>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>

      {/* Text Info */}
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-heading font-bold text-slate-900 flex items-center">
          {title}
          {active && !loading && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary ml-2 animate-ping" />
          )}
        </h4>
        <p className="text-xs text-slate-500 mt-1 leading-normal line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
};

export default AIToolCard;
