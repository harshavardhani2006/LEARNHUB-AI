import React, { useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';

export const ChatInput = ({ value, onChange, onSend, disabled, placeholder = "Ask a question..." }) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea height as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="relative flex items-end border border-slate-200 rounded-card bg-white shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 resize-none pl-3 pr-10 py-2 bg-transparent text-sm max-h-40 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-body text-slate-800 leading-relaxed placeholder:text-slate-400"
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className={`p-2.5 rounded-button text-white shadow-sm transition-all shrink-0 ${
          value.trim() && !disabled
            ? 'bg-gradient-to-r from-ai-purple to-accent-cyan hover:shadow-glow-ai hover:-translate-y-0.5'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
        }`}
        title="Send query"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ChatInput;
