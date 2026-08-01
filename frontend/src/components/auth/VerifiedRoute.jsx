import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * VerifiedRoute — Wraps routes that require a verified email.
 * Authenticated but unverified users see a gate screen instead of
 * being redirected to login.
 */
const VerifiedRoute = ({ children }) => {
  const { user, loading, emailVerified } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-6">
        <div className="max-w-md w-full bg-white rounded-card shadow-lg border border-slate-200 p-8 text-center">
          <div className="flex justify-center mb-5">
            <div className="p-4 bg-amber-50 rounded-full">
              <ShieldAlert className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 mb-2">
            Email Verification Required
          </h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            This feature requires a verified email address. Please verify your email to unlock
            uploading, AI Tutor access, and chat history.
          </p>
          <Link
            to="/verify-email"
            className="inline-flex items-center space-x-2 py-2.5 px-6 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-button transition-all shadow-sm"
          >
            <Mail className="w-4 h-4" />
            <span>Go to Verification Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return children;
};

export default VerifiedRoute;
