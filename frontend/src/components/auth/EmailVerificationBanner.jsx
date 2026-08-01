import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Mail, X, RefreshCw } from 'lucide-react';

/**
 * EmailVerificationBanner — Persistent amber banner shown on all
 * authenticated pages when the user's email is not yet verified.
 * Includes a resend button with a 60-second cooldown timer.
 */
const EmailVerificationBanner = () => {
  const { user, emailVerified, resendVerification } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Only render when logged in with unverified email
  if (!user || emailVerified || dismissed) return null;

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    try {
      setResendLoading(true);
      setResendSuccess(false);
      await resendVerification(user.email);
      setResendSuccess(true);

      // Start 60-second cooldown
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
      console.error('Resend verification error:', err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3"
      role="alert"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-x-4">
        <div className="flex items-center gap-x-3 min-w-0">
          <Mail className="w-5 h-5 text-amber-600 shrink-0" aria-hidden="true" />
          <p className="text-sm text-amber-800 truncate">
            <span className="font-semibold">Verify your email</span>
            {' '}to unlock uploading, AI Tutor, and chat features.
          </p>
        </div>

        <div className="flex items-center gap-x-3 shrink-0">
          {resendSuccess && (
            <span className="text-xs text-emerald-700 font-medium">
              ✓ Sent!
            </span>
          )}
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resendLoading}
            className="inline-flex items-center gap-x-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-button transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Resend verification email"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : resendLoading ? 'Sending...' : 'Resend Email'}
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="text-amber-500 hover:text-amber-700 transition-colors p-1 rounded"
            aria-label="Dismiss email verification reminder"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;
