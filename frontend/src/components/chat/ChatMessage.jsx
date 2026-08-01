import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export const ChatMessage = ({ message }) => {
  const { sender, message: text } = message;
  const isUser = sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex w-full space-x-3 max-w-3xl ${isUser ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}>
      
      {/* Avatar (Left side of assistant bubble) */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ai-purple to-accent-cyan flex items-center justify-center text-white shrink-0 shadow-sm border border-purple-100">
          <Bot className="w-4.5 h-4.5" />
        </div>
      )}

      {/* Message Box */}
      <div className="relative group max-w-[85%]">
        
        {/* User Message Bubble */}
        {isUser ? (
          <div className="bg-primary text-white px-4 py-2.5 rounded-2xl rounded-tr-none text-sm leading-relaxed shadow-sm font-medium">
            {text}
          </div>
        ) : (
          
          /* Assistant Message Bubble with Markdown Support */
          <div className="bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm space-y-2">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="text-slate-700" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-lg font-heading font-bold text-slate-900 mt-3 mb-1" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-base font-heading font-bold text-slate-900 mt-2 mb-1" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-sm font-heading font-semibold text-slate-900 mt-2 mb-1" {...props} />,
                code: ({ node, inline, className, children, ...props }) => {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline ? (
                    <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-lg my-2 overflow-x-auto font-mono text-xs border border-slate-800 leading-snug">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                  ) : (
                    <code className="bg-slate-100 text-primary-700 px-1.5 py-0.5 rounded font-mono text-xs font-semibold" {...props}>
                      {children}
                    </code>
                  );
                },
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-3 border border-slate-200 rounded-lg">
                    <table className="w-full text-xs text-left border-collapse" {...props} />
                  </div>
                ),
                th: ({ node, ...props }) => <th className="bg-slate-50 p-2.5 font-semibold text-slate-700 border-b border-slate-200" {...props} />,
                td: ({ node, ...props }) => <td className="p-2.5 border-b border-slate-100 text-slate-600" {...props} />
              }}
            >
              {text}
            </ReactMarkdown>

            {/* Copy Button (Floating) */}
            <button
              onClick={handleCopy}
              className="absolute top-2.5 right-2.5 p-1 bg-white hover:bg-slate-100 border border-slate-150 rounded-lg text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-150 shadow-sm shrink-0"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0 shadow-sm">
          <User className="w-4.5 h-4.5" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
