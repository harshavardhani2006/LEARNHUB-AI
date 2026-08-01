import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    try {
      setLoading(true);
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-indigo-950 to-primary flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="p-2 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">LearnHub AI</span>
        </div>

        <div className="bg-white rounded-card shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
            </div>
            <h1 className="font-heading text-2xl font-bold text-slate-900 mb-2">Forgot Password?</h1>
            <p className="text-slate-500 text-sm">
              Enter your email and we'll send you a reset link.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 p-4 bg-emerald-50 border border-emerald-200 rounded-button">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">
                  Reset link sent! Check your inbox.
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Didn't receive it? Check your spam folder or{' '}
                <button
                  onClick={() => { setSuccess(false); setEmail(''); }}
                  className="text-primary font-medium hover:underline"
                >
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-button text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="forgot-email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-button text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary hover:bg-blue-700 text-white font-medium rounded-button shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1 text-sm text-slate-500 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
