import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Upload, Bot, MessageSquare, User, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = ({ className = '', onNavigate }) => {
  const { emailVerified } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: 'Home', path: '/dashboard', icon: Home, requiresVerification: false },
    { label: 'Resources', path: '/resources', icon: BookOpen, requiresVerification: false },
    { label: 'Upload', path: '/upload', icon: Upload, requiresVerification: true },
    { label: 'AI Tutor', path: '/ai-tutor', icon: Bot, requiresVerification: true },
    { label: 'My Chats', path: '/my-chats', icon: MessageSquare, requiresVerification: true },
    { label: 'Profile', path: '/profile', icon: User, requiresVerification: false },
  ];

  return (
    <aside className={`w-[260px] bg-sidebar flex flex-col h-screen sticky top-0 ${className}`}>
      {/* Brand */}
      <div className="h-[64px] flex items-center px-6 border-b border-white/10 shrink-0">
        <Link to="/dashboard" onClick={onNavigate} className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-heading font-bold text-white text-lg tracking-wide">
            LearnHub <span className="text-accent-cyan">AI</span>
          </span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const isLocked = item.requiresVerification && !emailVerified;

          if (isLocked) {
            return (
              <div 
                key={item.path}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg text-slate-400 opacity-60 cursor-not-allowed group relative"
                title="Verify your email to access this feature"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
                <Lock className="w-4 h-4 text-slate-500" />
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/10 text-white relative' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-cyan' : 'group-hover:text-accent-cyan transition-colors'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer area inside sidebar (optional) */}
      <div className="p-4 border-t border-white/10 text-xs text-slate-500">
        <p>© 2025 LearnHub AI</p>
      </div>
    </aside>
  );
};
