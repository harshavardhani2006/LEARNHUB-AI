import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { BookOpen, Upload, Bot, MessageSquare, ArrowRight, Clock, Loader2 } from 'lucide-react';

export const Dashboard = () => {
  const { profile, user } = useAuth();
  const [recentResources, setRecentResources] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const name = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

  useEffect(() => {
    api.get('/resources?sort=newest&limit=3')
      .then(res => setRecentResources(res.data.resources || []))
      .catch(() => {})
      .finally(() => setLoadingResources(false));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/conversations/${user.id}`)
      .then(res => setRecentChats((res.data.conversations || []).slice(0, 2)))
      .catch(() => {})
      .finally(() => setLoadingChats(false));
  }, [user]);

  const quickActions = [
    {
      title: 'Browse Resources',
      description: 'Find study materials from others',
      icon: BookOpen,
      path: '/resources',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100 hover:border-blue-200'
    },
    {
      title: 'Upload Material',
      description: 'Share PDFs or notes to get AI tools',
      icon: Upload,
      path: '/upload',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100 hover:border-emerald-200'
    },
    {
      title: 'Ask AI Tutor',
      description: 'Chat with the RAG assistant',
      icon: Bot,
      path: '/ai-tutor',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-100 hover:border-purple-200'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-slate-900">
          {getGreeting()}, {name} <span className="animate-pulse inline-block origin-bottom-right">👋</span>
        </h1>
        <p className="text-slate-500 mt-2">Ready to learn something new today?</p>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action, idx) => (
          <Link
            key={idx}
            to={action.path}
            className={`group p-6 rounded-card border bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 ${action.border}`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${action.bg}`}>
              <action.icon className={`w-6 h-6 ${action.color}`} />
            </div>
            <h3 className="font-heading font-semibold text-lg text-slate-900 mb-1 group-hover:text-primary transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-slate-500">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Resources */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-semibold text-xl text-slate-900">Recent Resources</h2>
            <Link to="/resources" className="text-sm font-medium text-primary hover:text-blue-700 flex items-center">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          {loadingResources ? (
            <div className="bg-white border border-slate-200 rounded-card p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : recentResources.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-card p-8 text-center border-dashed">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-slate-600 font-medium">No resources yet</p>
              <p className="text-sm text-slate-500 mt-1 mb-4">Start exploring or upload your own material.</p>
              <Link to="/resources" className="inline-flex px-4 py-2 bg-slate-100 text-slate-700 rounded-button text-sm font-medium hover:bg-slate-200 transition-colors">
                Explore Library
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResources.map(r => (
                <Link
                  key={r.id}
                  to={`/resources/${r.id}`}
                  className="flex items-center space-x-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-primary hover:shadow-md transition-all group"
                >
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm group-hover:text-primary transition-colors truncate">
                      {r.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.subject} • {r.views} views</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Continue Learning — recent chats */}
        <div className="space-y-4">
          <h2 className="font-heading font-semibold text-xl text-slate-900">Continue Learning</h2>

          {loadingChats ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          ) : recentChats.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
              <Bot className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No chats yet.</p>
              <Link to="/ai-tutor" className="text-xs text-primary font-medium hover:underline mt-1 inline-block">
                Start a conversation
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentChats.map(conv => (
                <Link
                  key={conv.id}
                  to={`/ai-tutor/${conv.id}`}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm group hover:border-primary transition-colors flex items-start space-x-3"
                >
                  <div className="p-2 bg-purple-50 rounded-lg shrink-0">
                    <Bot className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 font-medium mb-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Last AI conversation
                    </p>
                    <p className="font-medium text-slate-900 text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {conv.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
