import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import ResourceCard from './ResourceCard';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ResourceGrid = ({ search, subject, sort }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/resources', {
        params: {
          search,
          subject,
          sort,
          page,
          limit: 9 // Show 9 per page for nice layout
        }
      });
      setResources(response.data.resources);
      setTotalPages(response.data.total_pages);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, subject, sort, page]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, subject, sort]);

  const handleLike = async (id) => {
    // Optimistically update UI
    setResources(prev =>
      prev.map(r => r.id === id ? { ...r, likes: r.likes + 1 } : r)
    );
    try {
        const response = await api.post(`/resources/${id}/like`);
        // Update with server-confirmed likes count
        const newLikes = response.data.likes;
        setResources(prev =>
          prev.map(r => r.id === id ? { ...r, likes: newLikes } : r)
        );
    } catch (err) {
        console.error('Failed to like resource:', err);
        // Optionally revert optimistic update (not implemented)
    }
};

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 border border-slate-200 rounded-card bg-white space-y-4">
            <Skeleton variant="avatar" className="w-16 h-6 rounded-full" />
            <Skeleton variant="title" className="w-3/4" />
            <Skeleton variant="text" className="w-full" />
            <Skeleton variant="text" className="w-5/6" />
            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <Skeleton variant="text" className="w-1/3" />
              <Skeleton variant="text" className="w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button 
          onClick={fetchResources}
          className="px-4 py-2 bg-slate-900 text-white rounded-button hover:bg-slate-800 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-card p-12 shadow-sm">
        <EmptyState
          icon={BookOpen}
          title="No resources found"
          description={
            search || (subject && subject !== 'All')
              ? "We couldn't find anything matching your filters. Try clearing them or upload something new."
              : 'The resource library is currently empty. Be the first to upload study material!'
          }
          actionText="Upload Material"
          onAction={() => navigate('/upload')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard 
            key={resource.id} 
            resource={resource} 
            onLike={handleLike}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-500">
            Page <span className="font-medium text-slate-900">{page}</span> of{' '}
            <span className="font-medium text-slate-900">{totalPages}</span>
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-button bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 rounded-button bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceGrid;
