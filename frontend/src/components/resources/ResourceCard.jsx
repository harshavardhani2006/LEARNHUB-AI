import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, MessageSquare, Bot, BookOpen, FileText, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';

// Simple relative time formatter
const formatRelativeTime = (dateString) => {
  if (!dateString || dateString === 'dummy_url') return 'recently';
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return 'recently';
  }
};

// Map database subjects to friendly badge tags
const mapSubject = (subject) => {
  if (subject === 'Database Management Systems') return 'DBMS';
  if (subject === 'Artificial Intelligence') return 'AI';
  if (subject === 'Interview Preparation') return 'Interview Prep';
  return subject;
};

export const ResourceCard = ({ resource, onLike, onDelete }) => {
  const { user, profile } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const {
    id,
    title,
    subject,
    description,
    uploaded_by,
    uploader_name,
    created_at,
    views = 0,
    likes = 0,
    ai_interactions = 0 // default count
  } = resource;

  const handleLikeClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) onLike(id);
  };

  const handleDeleteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeleting(true);
    try {
      await api.delete(`/resources/${id}`);
      if (onDelete) onDelete(id);
    } catch (err) {
      console.error('Failed to delete resource:', err);
      alert('Failed to delete resource. Only owners and admins can delete resources.');
    } finally {
      setDeleting(false);
    }
  };

  const isOwner = user?.id === uploaded_by;
  const isAdmin = profile?.role === 'admin';
  const canDelete = isOwner || isAdmin;

  return (
    <div className="group bg-white border border-slate-200 rounded-card p-5 hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col h-full hover:-translate-y-1 relative">
      
      {/* Delete Trigger Badge */}
      {canDelete && (
        <button
          onClick={handleDeleteClick}
          disabled={deleting}
          className="absolute top-4 right-4 p-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 shadow-sm"
          title="Delete document"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* Subject badge and Doc Icon */}
      <div className="flex items-center justify-between mb-4">
        <Badge subject={mapSubject(subject)}>
          {mapSubject(subject)}
        </Badge>
        {!canDelete && <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />}
      </div>

      {/* Title & Description */}
      <div className="flex-1 min-h-[90px] mb-4">
        <Link to={`/resources/${id}`}>
          <h3 className="font-heading font-semibold text-slate-900 group-hover:text-primary transition-colors text-base line-clamp-2 leading-snug">
            {title}
          </h3>
        </Link>
        {description && (
          <p className="text-slate-500 text-xs mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Contributor and Time */}
      <div className="text-slate-400 text-xs mb-4 flex items-center space-x-1.5 border-b border-slate-100 pb-3">
        <span className="font-medium text-slate-600 truncate max-w-[120px]">
          {uploader_name || 'Anonymous'}
        </span>
        <span>•</span>
        <span>{formatRelativeTime(created_at)}</span>
      </div>

      {/* Stats Row */}
      <div className="flex items-center space-x-4 text-slate-400 text-xs mb-5">
        <span className="flex items-center space-x-1" title="Views">
          <Eye className="w-4 h-4 text-slate-400" />
          <span>{views}</span>
        </span>
        <button 
          onClick={handleLikeClick}
          className="flex items-center space-x-1 hover:text-red-500 transition-colors" 
          title="Likes"
        >
          <Heart className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
          <span>{likes}</span>
        </button>
        <span className="flex items-center space-x-1" title="AI Interactions">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <span>{ai_interactions}</span>
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <Link to={`/resources/${id}`} className="w-full">
          <Button variant="secondary" size="sm" className="w-full justify-center">
            <BookOpen className="w-4 h-4 mr-1.5" />
            Read
          </Button>
        </Link>
        <Link to={`/ai-tutor?resource_id=${id}`} className="w-full">
          <Button variant="ai" size="sm" className="w-full justify-center shadow-sm">
            <Bot className="w-4 h-4 mr-1.5" />
            Ask AI
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ResourceCard;
