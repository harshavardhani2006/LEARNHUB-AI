import React, { useState } from 'react';
import { Search, MessageSquare, Trash2, Edit3, Check, X, Sparkles, BookOpen } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const ConversationList = ({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onRename,
  onCreateNew
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (e, id, currentTitle) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const cancelEditing = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleSaveRename = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat history? This cannot be undone.')) {
      onDelete(id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300 w-full md:w-[280px] shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <span className="font-heading font-bold text-sm tracking-wide text-white uppercase">
          Conversations
        </span>
        <button
          onClick={onCreateNew}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="New Chat"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search chats..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-button py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent text-white transition-all placeholder:text-slate-655"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            No chats found
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeId === conv.id;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => !isEditing && onSelect(conv.id)}
                className={`group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'hover:bg-slate-850 text-slate-400 hover:text-slate-200'
                }`}
              >
                {isEditing ? (
                  <div className="flex items-center space-x-1.5 w-full pr-8">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-slate-950 text-xs text-white border border-slate-700 rounded px-1.5 py-1 w-full focus:outline-none"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(e, conv.id);
                        if (e.key === 'Escape') cancelEditing(e);
                      }}
                    />
                    <button
                      onClick={(e) => handleSaveRename(e, conv.id)}
                      className="text-emerald-500 hover:text-emerald-400 p-0.5 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="text-red-500 hover:text-red-400 p-0.5 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start space-x-2.5 min-w-0 pr-12">
                    {conv.subject ? (
                      <BookOpen className="w-4 h-4 text-accent-cyan mt-0.5 shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" title={conv.title}>
                        {conv.title}
                      </p>
                      {conv.subject && (
                        <p className="text-[10px] text-accent-cyan font-semibold mt-0.5 uppercase tracking-wider">
                          {conv.subject}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit & Delete Action icons on hover */}
                {!isEditing && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 group-hover:bg-transparent pl-2">
                    <button
                      onClick={(e) => startEditing(e, conv.id, conv.title)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                      title="Rename"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(e, conv.id)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Internal icon stub to avoid importing plus since Lucide Plus can sometimes be inconsistent
const PlusIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default ConversationList;
