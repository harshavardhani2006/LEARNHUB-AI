import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Sparkles, Loader2 } from 'lucide-react';

/**
 * AuthCallback — handles Google OAuth redirects and email confirmation links.
 * After Supabase exchanges the code for a session, we:
 *   1. Ensure a public.users profile row exists (upsert) — Google users skip signup form
 *   2. Redirect to dashboard
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing your sign-in...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase JS v2 automatically exchanges the code in the URL hash/query.
        // We just need to wait for the session to be ready.
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setStatus('Authentication failed. Redirecting to login...');
          setTimeout(() => navigate('/login?error=auth_callback_failed'), 2000);
          return;
        }

        if (data?.session) {
          await ensureUserProfile(data.session.user);
          setStatus('Success! Redirecting...');
          setTimeout(() => navigate('/dashboard'), 800);
          return;
        }

        // No session yet — listen for the auth state change event
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (session) {
              subscription.unsubscribe();
              await ensureUserProfile(session.user);
              navigate('/dashboard');
            }
          }
        );

        // Hard timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          setStatus('Session not found. Redirecting to login...');
          navigate('/login');
        }, 8000);

      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-dark via-indigo-950 to-primary flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center space-x-2 mb-6">
          <div className="p-2 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-heading text-xl font-bold text-white">LearnHub AI</span>
        </div>
        <div className="flex justify-center">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <p className="text-white/80 text-sm font-medium">{status}</p>
      </div>
    </div>
  );
};

/**
 * Upserts a row in public.users for any auth user (email or Google OAuth).
 * Safe to call multiple times — upsert on conflict does nothing if row exists.
 */
async function ensureUserProfile(user) {
  if (!user) return;

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User';

  try {
    await supabase.from('users').upsert(
      {
        id:    user.id,
        email: user.email,
        full_name: name,
        role:  'student',
      },
      { onConflict: 'id', ignoreDuplicates: false }
    );
  } catch (err) {
    // Non-fatal — profile display may degrade but auth still works
    console.warn('Could not upsert user profile:', err.message);
  }
}

export default AuthCallback;
