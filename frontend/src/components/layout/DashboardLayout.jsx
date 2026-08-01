import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import EmailVerificationBanner from '../auth/EmailVerificationBanner';

export const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed drawer on mobile, static on desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:block ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar className="shadow-xl lg:shadow-none" onNavigate={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-0 overflow-hidden">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Verification Banner */}
        <EmailVerificationBanner />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:pb-6 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
        
        {/* Mobile Bottom Navigation Bar */}
        <BottomNav />
      </div>
    </div>
  );
};
