import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';

const VerifyEmail = () => {
  const { user, resendVerification } = useAuth();
  const location = useLocation();
  const emailFromState = location.state?.email || user?.email || '';

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendError('');
    setResendSuccess(false);
    try {
      setResendLoading(true);
      await resendVerification(emailFromState);
      setResendSuccess(true);

      let remaining = 60;
      setCooldown(remaining);
      const interval = setInterval(() => {
        remaining -= 1;
        setCooldown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          setResendSuccess(false);
        }
      }, 1000);
    } catch (err) {
      setResendError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-indigo-950 to-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="p-2 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">LearnHub AI</span>
        </div>

        <div className="bg-white rounded-card shadow-xl p-8 text-center">
          {/* Envelope Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
          </div>

          <h1 className="font-heading text-2xl font-bold text-slate-900 mb-3">
            Verify Your Email
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            We've sent a verification link to
          </p>
          {emailFromState && (
            <p className="font-semibold text-slate-800 text-sm mb-6 break-all">
              {emailFromState}
            </p>
          )}
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Please check your inbox (and spam folder) and click the confirmation link to activate your account.
          </p>

          {/* Resend Success */}
          {resendSuccess && (
            <div className="flex items-center justify-center space-x-2 p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-button">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">Verification email resent!</span>
            </div>
          )}

          {/* Resend Error */}
          {resendError && (
            <p className="text-sm text-red-600 mb-4">{resendError}</p>
          )}

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resendLoading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary hover:bg-blue-700 text-white font-medium rounded-button transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm mb-4"
          >
            <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
            <span>
              {cooldown > 0 ? `Resend in ${cooldown}s` : resendLoading ? 'Sending...' : 'Resend Verification Email'}
            </span>
          </button>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-500">
            <p>
              Wrong email?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up again
              </Link>
            </p>
            <p>
              Already verified?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
