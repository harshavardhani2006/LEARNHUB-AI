import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import VerifiedRoute from './components/auth/VerifiedRoute';
import EmailVerificationBanner from './components/auth/EmailVerificationBanner';
import ErrorBoundary from './components/ui/ErrorBoundary';

import { DashboardLayout } from './components/layout/DashboardLayout';

// Auth Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Upload from './pages/Upload';
import AITutor from './pages/AITutor';
import Profile from './pages/Profile';
import MyChats from './pages/MyChats';

// Stub Pages (to be replaced in later phases)
const PageStub = ({ title }) => (
  <div className="min-h-screen bg-surface p-8 font-body">
    <div className="max-w-4xl mx-auto bg-white rounded-card p-8 shadow-md border border-slate-200">
      <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500 text-sm">
        This page will be implemented in a later phase. Auth is complete.
      </p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            {/* === Public Routes === */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* === Protected: Auth required, email verification NOT required === */}
            <Route
              path="/verify-email"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <VerifyEmail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* === Protected: Auth required, email verification required === */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  </VerifiedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources"
              element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <DashboardLayout>
                      <Resources />
                    </DashboardLayout>
                  </VerifiedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/resources/:id"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ResourceDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* === Verified Routes: Auth + verified email required === */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <DashboardLayout>
                      <Upload />
                    </DashboardLayout>
                  </VerifiedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-tutor"
              element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <DashboardLayout>
                      <AITutor />
                    </DashboardLayout>
                  </VerifiedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-tutor/:conversationId"
              element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <DashboardLayout>
                      <AITutor />
                    </DashboardLayout>
                  </VerifiedRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-chats"
              element={
                <ProtectedRoute>
                  <VerifiedRoute>
                    <DashboardLayout>
                      <MyChats />
                    </DashboardLayout>
                  </VerifiedRoute>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
