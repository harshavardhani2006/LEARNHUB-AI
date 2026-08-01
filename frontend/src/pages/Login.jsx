import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoginForm } from '../components/auth/LoginForm';
import { GoogleAuthButton } from '../components/auth/GoogleAuthButton';
import { Sparkles, BookOpen, Bot, Zap } from 'lucide-react';

const Login = () => {
  const { user, loading } = useAuth();

  // Already logged in → go to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL — Brand / Illustration */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-to-br from-bg-dark via-indigo-950 to-primary p-12 relative overflow-hidden">
        {/* Background decoration orbs */}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-ai-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-accent-cyan/15 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="flex items-center space-x-2 z-10">
          <div className="p-2 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">
            LearnHub <span className="text-accent-cyan">AI</span>
          </span>
        </div>

        {/* Center copy */}
        <div className="z-10 space-y-6">
          <h1 className="font-heading text-4xl font-bold text-white leading-tight">
            Your AI-powered<br />
            <span className="text-accent-cyan">learning workspace</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Upload study materials, get AI summaries, ask doubts, and master any subject — all in one place.
          </p>

          {/* Feature List */}
          <div className="space-y-3">
            {[
              { icon: BookOpen, text: 'Browse & share learning resources' },
              { icon: Bot, text: 'RAG-powered AI tutoring assistant' },
              { icon: Zap, text: 'Instant revision notes & flashcards' },
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

        {/* Bottom tagline */}
        <p className="text-slate-500 text-xs z-10">
          © 2025 LearnHub AI. Built with RAG + LLM.
        </p>
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center space-x-2 mb-8 lg:hidden">
            <div className="p-1.5 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold text-slate-900">LearnHub AI</span>
          </div>

          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">Sign in to continue learning</p>
          </div>

          {/* Google OAuth */}
          <GoogleAuthButton label="Continue with Google" />

          {/* Divider */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-slate-200" />
            <span className="px-3 text-xs text-slate-400 font-medium">or continue with email</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Email/Password form */}
          <LoginForm />

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:text-blue-700 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
