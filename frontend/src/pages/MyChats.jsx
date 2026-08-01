import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { 
  Bot, Search, Trash2, Edit2, Check, X, Loader2,
  ArrowUpDown, MessageSquare, AlertCircle, BookOpen 
} from 'lucide-react';

export const MyChats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // 'date_desc' | 'date_asc' | 'title'
  
  // Renaming state
  const [renameId, setRenameId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch conversation lists
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/conversations/${user.id}`);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Rename handler
  const handleRename = async (id) => {
    if (!renameTitle.trim()) {
      setRenameId(null);
      return;
    }
    try {
      const res = await api.patch(`/conversations/${id}`, { title: renameTitle.trim() });
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title: res.data.title } : c)
      );
      setRenameId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/conversations/${deleteId}`);
      setConversations(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  // Filter & Sort logic
  const filteredConversations = conversations
    .filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'date_asc') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else {
        // Default: date desc
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" className="w-1/3" />
        <Skeleton variant="card" className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Header controls */}
      <div className="bg-white border border-slate-200 rounded-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="space-y-1">
          <h1 className="font-heading font-bold text-lg text-slate-900 leading-tight">My Chats</h1>
          <p className="text-xs text-slate-500 font-medium">Review, rename, or resume your previous tutor discussions.</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search chat sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-slate-800 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Sort selector */}
          <div className="flex items-center space-x-1.5 w-full sm:w-auto shrink-0 border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-xs text-slate-500 font-semibold select-none">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-800"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main chats grid */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filteredConversations.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-card p-12 text-center text-slate-400 h-64 flex flex-col items-center justify-center">
            <Bot className="w-10 h-10 text-slate-350 mb-3 animate-float" />
            <p className="text-sm font-semibold text-slate-800">No chat history found</p>
            <p className="text-xs mt-1">Start a new study session with the AI Tutor.</p>
            <Button
              className="mt-4 text-xs"
              onClick={() => navigate('/ai-tutor')}
            >
              Start Chat
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className="bg-white border border-slate-200 rounded-card p-5 hover:border-primary hover:shadow-md transition-all duration-300 flex items-start justify-between gap-4 cursor-pointer group"
                onClick={() => {
                  // Only navigate if we aren't currently editing
                  if (renameId !== conv.id) {
                    navigate(`/ai-tutor/${conv.id}`);
                  }
                }}
              >
                <div className="flex items-start space-x-4 min-w-0">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  
                  <div className="space-y-1.5 min-w-0">
                    {renameId === conv.id ? (
                      <div className="flex items-center space-x-1.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          className="border border-slate-300 rounded px-2 py-1 text-xs focus:outline-none text-slate-850"
                        />
                        <button
                          onClick={() => handleRename(conv.id)}
                          className="p-1 hover:bg-slate-100 rounded text-emerald-500"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRenameId(null)}
                          className="p-1 hover:bg-slate-100 rounded text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h3 className="font-heading font-bold text-slate-850 text-sm truncate group-hover:text-primary transition-colors">
                          {conv.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameId(conv.id);
                            setRenameTitle(conv.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-655 transition-opacity"
                          title="Rename conversation"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-semibold">
                      <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                      {conv.resource_id && (
                        <>
                          <span>•</span>
                          <span className="flex items-center text-primary/80">
                            <BookOpen className="w-3 h-3 mr-1" /> PDF Scope
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteId(conv.id);
                  }}
                  className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 border border-transparent hover:border-red-100 transition-all shrink-0 self-center"
                  title="Delete chat session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-card p-6 max-w-sm w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-3 text-red-500">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-heading font-bold text-sm text-slate-900">Delete Conversation</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to delete this chat session? This action is permanent and cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs"
              >
                {deleting ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Deleting...</>
                ) : (
                  'Delete Permanently'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyChats;
