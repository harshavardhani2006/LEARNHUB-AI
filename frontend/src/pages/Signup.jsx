import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SignupForm } from '../components/auth/SignupForm';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { Sparkles, Shield, Users, Brain } from 'lucide-react';

const Signup = () => {
  const { user, loading } = useAuth();

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — Brand */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-bg-dark via-indigo-950 to-ai-purple p-12 relative overflow-hidden">
        <div className="absolute top-1/3 -left-16 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-56 h-56 bg-accent-cyan/15 rounded-full blur-3xl" />

        <div className="flex items-center space-x-2 z-10">
          <div className="p-2 bg-gradient-to-br from-primary to-accent-cyan rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">
            LearnHub <span className="text-accent-cyan">AI</span>
          </span>
        </div>

        <div className="z-10 space-y-6">
          <h1 className="font-heading text-4xl font-bold text-white leading-tight">
            Start your<br />
            <span className="text-accent-cyan">AI learning</span> journey
          </h1>
          <p className="text-slate-300 text-lg">
            Join thousands of students and educators sharing knowledge and learning smarter.
          </p>

          <div className="space-y-3">
            {[
              { icon: Brain, text: 'AI-powered study tools for every subject' },
              { icon: Users, text: 'Community-driven resource sharing' },
              { icon: Shield, text: 'Secure, verified academic community' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center space-x-3">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <Icon className="w-4 h-4 text-accent-cyan" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-500 text-xs z-10">© 2025 LearnHub AI. Free to use.</p>
      </div>

      {/* RIGHT PANEL — Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center space-x-2 mb-8 lg:hidden">
            <div className="p-1.5 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-slate-900">LearnHub AI</span>
          </div>

          <div className="mb-6">
            <h2 className="font-heading text-2xl font-bold text-slate-900">Create your account</h2>
            <p className="text-slate-500 text-sm mt-1">Free forever. No credit card needed.</p>
          </div>

          <GoogleAuthButton label="Sign up with Google" />

          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs text-slate-400 font-medium">or register with email</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          <SignupForm />

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
