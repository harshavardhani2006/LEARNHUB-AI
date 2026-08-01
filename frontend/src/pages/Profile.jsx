import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { ResourceCard } from '../components/resources/ResourceCard';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import {
  User, Mail, ShieldAlert, Award, FileText,
  MessageSquare, Settings, Lock, Edit3, Check,
  KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

export const Profile = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'documents' | 'settings'
  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'documents';

  const setTab = (tab) => setSearchParams(tab === 'settings' ? { tab: 'settings' } : {});

  // Profile data & Stats
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ uploads_count: 0, chats_count: 0 });
  const [myResources, setMyResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Name edit
  const [newName, setNewName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [updatingName, setUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password change
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const settingsRef = useRef(null);

  // Load data
  const loadProfileData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const statsRes = await api.get(`/users/${user.id}/stats`);
      setProfile(statsRes.data.profile);
      setStats(statsRes.data.stats);
      setNewName(statsRes.data.profile.full_name || '');

      const resourcesRes = await api.get(`/resources?limit=100`);
      const all = resourcesRes.data.resources || [];
      setMyResources(all.filter(r => r.uploaded_by === user.id));
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfileData(); }, [loadProfileData]);

  // Scroll settings panel into view when tab=settings opens
  useEffect(() => {
    if (activeTab === 'settings' && settingsRef.current) {
      settingsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab]);

  // Name update
  const handleUpdateName = async () => {
    if (!newName.trim() || newName === profile?.full_name) {
      setIsEditingName(false);
      return;
    }
    setUpdatingName(true);
    setNameError('');
    setNameSuccess('');
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: newName.trim() } });
      if (error) throw error;
      await supabase.from('users').update({ full_name: newName.trim() }).eq('id', user.id);
      setProfile(prev => ({ ...prev, full_name: newName.trim() }));
      setIsEditingName(false);
      setNameSuccess('Name updated!');
      setTimeout(() => setNameSuccess(''), 3000);
    } catch (err) {
      setNameError(err.message || 'Failed to update name.');
    } finally {
      setUpdatingName(false);
    }
  };

  // Password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (password.length < 8) { setPasswordError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordSuccess('Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" className="w-1/3" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  const isVerified = user?.email_confirmed_at || profile?.role === 'admin';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Profile Header Card ── */}
      <div className="bg-white border border-slate-200 rounded-card p-6 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-5 text-center md:text-left">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/30 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-inner">
            <User className="w-10 h-10" />
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {isEditingName ? (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateName(); if (e.key === 'Escape') setIsEditingName(false); }}
                    className="border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-slate-800"
                    disabled={updatingName}
                    autoFocus
                  />
                  <button onClick={handleUpdateName} disabled={updatingName}
                    className="p-1 hover:bg-slate-100 rounded text-emerald-500 disabled:opacity-50">
                    {updatingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="font-heading font-bold text-xl text-slate-900 truncate">
                    {profile?.full_name || 'Student'}
                  </h1>
                  <button onClick={() => setIsEditingName(true)}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600" title="Edit name">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {isVerified ? (
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center">
                  <Award className="w-3.5 h-3.5 mr-1 text-emerald-500" /> Verified
                </span>
              ) : (
                <span className="bg-amber-50 border border-amber-200 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center animate-pulse">
                  <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-500" /> Unverified
                </span>
              )}
              {profile?.role === 'admin' && (
                <span className="bg-red-50 border border-red-200 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Admin</span>
              )}
            </div>

            {nameSuccess && <p className="text-[10px] text-emerald-600 font-semibold">{nameSuccess}</p>}
            {nameError   && <p className="text-[10px] text-red-500 font-semibold">{nameError}</p>}

            <p className="text-xs text-slate-500 flex items-center justify-center md:justify-start">
              <Mail className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              {profile?.email}
            </p>
          </div>
        </div>

        <Button variant="danger" onClick={logout} className="shrink-0 rounded-full text-xs">
          Sign Out
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-card p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 shrink-0"><FileText className="w-6 h-6" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Documents Shared</span>
            <span className="text-xl font-bold text-slate-800">{stats.uploads_count}</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-card p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 shrink-0"><MessageSquare className="w-6 h-6" /></div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Active AI Chats</span>
            <span className="text-xl font-bold text-slate-800">{stats.chats_count}</span>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="bg-white border border-slate-200 rounded-card shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab('documents')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'documents'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> My Documents
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>
        </div>

        {/* ── Tab: My Documents ── */}
        {activeTab === 'documents' && (
          <div className="p-6">
            {myResources.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                <FileText className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-semibold">No documents uploaded yet</p>
                <Link to="/upload" className="text-xs text-primary font-bold mt-1 hover:underline">
                  Upload your first file
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myResources.map(resource => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onLike={() => setMyResources(prev =>
                      prev.map(r => r.id === resource.id ? { ...r, likes: r.likes + 1 } : r)
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Settings ── */}
        {activeTab === 'settings' && (
          <div ref={settingsRef} className="p-6 space-y-8">

            {/* Change Password */}
            <div className="max-w-md space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <KeyRound className="w-4 h-4 text-slate-400" /> Change Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                      placeholder="Min 8 characters"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-slate-800"
                      placeholder="Re-enter password"
                      required
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" /> {passwordSuccess}
                  </div>
                )}

                <Button type="submit" disabled={updatingPassword} className="w-full justify-center">
                  {updatingPassword
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
                    : 'Update Password'}
                </Button>
              </form>
            </div>

            {/* Account Info */}
            <div className="max-w-md space-y-4">
              <h3 className="font-heading font-bold text-sm text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <User className="w-4 h-4 text-slate-400" /> Account Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-xs font-medium">Email</span>
                  <span className="text-slate-800 text-xs font-semibold">{profile?.email}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-xs font-medium">Role</span>
                  <span className="text-slate-800 text-xs font-semibold capitalize">{profile?.role || 'user'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-500 text-xs font-medium">Email Status</span>
                  {isVerified
                    ? <span className="text-emerald-600 text-xs font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Verified</span>
                    : <span className="text-amber-600 text-xs font-bold flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5" />Pending</span>
                  }
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="max-w-md space-y-4">
              <h3 className="font-heading font-bold text-sm text-red-600 flex items-center gap-2 pb-2 border-b border-red-100">
                <AlertCircle className="w-4 h-4" /> Danger Zone
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sign out of your account on this device. All unsaved progress will be lost.
              </p>
              <Button variant="danger" onClick={logout} className="text-xs">
                Sign Out of Account
              </Button>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default Profile;
