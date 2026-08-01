import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, UploadCloud, Bot, User } from 'lucide-react';

export const BottomNav = () => {
  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/resources', label: 'Library', icon: BookOpen },
    { to: '/upload', label: 'Upload', icon: UploadCloud },
    { to: '/ai-tutor', label: 'AI Tutor', icon: Bot },
    { to: '/profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-4 z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center space-y-1 py-1 w-14 rounded-xl transition-all ${
                isActive 
                  ? 'text-primary' 
                  : 'text-slate-400 hover:text-slate-655'
              }`
            }
            aria-label={item.label}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-bold select-none">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
