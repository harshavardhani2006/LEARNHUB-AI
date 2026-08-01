import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import ConversationList from '../components/chat/ConversationList';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import SuggestedQuestions from '../components/chat/SuggestedQuestions';
import { Bot, Sparkles, BookOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';

const DEFAULT_QUESTIONS = [
  "What is Database Normalization?",
  "What is the difference between 1NF, 2NF and 3NF?",
  "Explain SQL joins with examples.",
  "What are candidates keys in DBMS?"
];

export const AITutor = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Scoped resource ID from query parameter
  const resourceIdQuery = searchParams.get('resource_id');

  // State
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(conversationId || null);
  const [inputValue, setInputValue] = useState('');
  
  // Loading & Error states
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Active conversation metadata
  const [activeResource, setActiveResource] = useState(null);

  // References for scroll lock
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, generating]);

  // 1. Fetch user's conversation history list
  const fetchConversations = useCallback(async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const res = await api.get(`/conversations/${user.id}`);
      setConversations(res.data.conversations || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load past conversations.');
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Sync active ID with route parameter
  useEffect(() => {
    if (conversationId) {
      setActiveId(conversationId);
    } else {
      setActiveId(null);
      setMessages([]);
      setActiveResource(null);
    }
  }, [conversationId]);

  // 3. Fetch messages for the active conversation
  const fetchMessages = useCallback(async (id) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/${id}`);
      setMessages(res.data.messages || []);
      
      // Look up linked resource name if any
      const conv = conversations.find(c => c.id === id);
      if (conv?.resource_id) {
        try {
          const resDetail = await api.get(`/resources/${conv.resource_id}`);
          setActiveResource(resDetail.data);
        } catch {
          setActiveResource(null);
        }
      } else {
        setActiveResource(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load conversation history.');
    } finally {
      setLoadingMessages(false);
    }
  }, [conversations]);

  useEffect(() => {
    if (activeId) {
      fetchMessages(activeId);
    }
  }, [activeId, fetchMessages]);

  // 4. Create new conversation
  const handleCreateNew = async (scopedResourceId = null) => {
    try {
      let title = "New Conversation";
      const targetResourceId = scopedResourceId || resourceIdQuery;

      if (targetResourceId) {
        try {
          const resDetail = await api.get(`/resources/${targetResourceId}`);
          title = `Chat: ${resDetail.data.title}`;
        } catch {}
      }

      const res = await api.post('/conversations', {
        title,
        resource_id: targetResourceId || undefined
      });
      
      const newConv = res.data;
      setConversations(prev => [newConv, ...prev]);
      navigate(`/ai-tutor/${newConv.id}${targetResourceId ? `?resource_id=${targetResourceId}` : ''}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create new conversation.');
    }
  };

  // 5. Delete conversation
  const handleDelete = async (id) => {
    try {
      await api.delete(`/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        navigate('/ai-tutor');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete conversation.');
    }
  };

  // 6. Rename conversation
  const handleRename = async (id, newTitle) => {
    try {
      const res = await api.patch(`/conversations/${id}`, { title: newTitle });
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title: res.data.title } : c)
      );
    } catch (err) {
      console.error(err);
      setError('Failed to rename conversation.');
    }
  };

  // Auto-clearing error toast helper — must be defined before handleSend uses it
  const setToastError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  // 7. Core SSE Streaming client implementation
  const handleSend = async (messageText = null) => {
    const textToSend = messageText || inputValue;
    if (!textToSend.trim()) return;

    let currentConvId = activeId;

    // Create a new conversation on the fly if none is active
    if (!currentConvId) {
      try {
        const title = textToSend.substring(0, 50);
        const res = await api.post('/conversations', {
          title,
          resource_id: resourceIdQuery || undefined
        });
        currentConvId = res.data.id;
        setConversations(prev => [res.data, ...prev]);
        // Update URL path without triggering full reload, state will catch it
        window.history.pushState(null, '', `/ai-tutor/${currentConvId}`);
        setActiveId(currentConvId);
      } catch (err) {
        console.error(err);
        setError('Failed to initiate conversation.');
        return;
      }
    }

    // Append user message immediately (optimistic UI)
    const userMsg = { id: 'temp-user', sender: 'user', message: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setGenerating(true);
    
    // Add placeholder assistant message
    const assistantMsgPlaceholder = { id: 'temp-assistant', sender: 'assistant', message: '' };
    setMessages(prev => [...prev, assistantMsgPlaceholder]);

    try {
      // Use axios api instance (handles auth header automatically)
      const res = await api.post('/chat', {
        conversation_id: currentConvId,
        message: textToSend,
        resource_id: resourceIdQuery || undefined
      });

      const assistantAnswer = res.data.reply || '';

      // Update assistant bubble with full response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === 'temp-assistant'
            ? { ...msg, message: assistantAnswer }
            : msg
        )
      );

      // Re-fetch conversations to sync titles
      fetchConversations();

    } catch (err) {
      console.error(err);
      setToastError('Lost connection to AI Tutor. Please try again.');
      setMessages(prev =>
        prev.map(msg =>
          msg.id === 'temp-assistant'
            ? { ...msg, message: '⚠️ Error: Failed to get AI response. Please try again.' }
            : msg
        )
      );
    } finally {
      setGenerating(false);
    }
  };


  return (
    <div className="h-[calc(100vh-140px)] flex border border-slate-200 rounded-card overflow-hidden bg-white shadow-sm">
      
      {/* 1. Conversations Sidebar */}
      <ConversationList
        conversations={conversations}
        activeId={activeId}
        onSelect={(id) => navigate(`/ai-tutor/${id}`)}
        onDelete={handleDelete}
        onRename={handleRename}
        onCreateNew={() => handleCreateNew()}
      />

      {/* 2. Chat Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-slate-50">
        
        {/* Chat Header */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center space-x-2 min-w-0">
            <Bot className="w-5 h-5 text-primary shrink-0" />
            <div className="min-w-0">
              <span className="font-heading font-semibold text-slate-800 text-sm truncate block">
                {activeId 
                  ? conversations.find(c => c.id === activeId)?.title || 'AI Tutor'
                  : 'AI Tutor Session'
                }
              </span>
              {activeResource && (
                <span className="text-[10px] text-primary font-medium flex items-center space-x-1 shrink-0">
                  <BookOpen className="w-3 h-3 mr-1" />
                  <span>Scoped to PDF: {activeResource.title}</span>
                </span>
              )}
            </div>
          </div>
          
          {resourceIdQuery && !activeResource && (
            <div className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500 animate-spin" />
              Resource Scope Active
            </div>
          )}
        </div>

        {/* Messages viewport */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Empty state */}
          {messages.length === 0 && !loadingMessages && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-lg mx-auto py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-ai-purple rounded-2xl flex items-center justify-center text-white shadow-lg animate-float">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold text-slate-850">
                  Ask me anything!
                </h2>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  I can explain database normalization, explain code snippets, generate diagrams, or query documents uploaded in your workspace.
                </p>
              </div>

              {/* Starter prompts */}
              <div className="w-full">
                <SuggestedQuestions 
                  questions={DEFAULT_QUESTIONS} 
                  onClick={(q) => handleSend(q)} 
                />
              </div>
            </div>
          )}

          {/* Loading History */}
          {loadingMessages && activeId && (
            <div className="h-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Message List */}
          {!loadingMessages && messages.map((msg, index) => (
            <ChatMessage key={msg.id || index} message={msg} />
          ))}

          {/* Assistant typing loader */}
          {generating && messages[messages.length - 1]?.message === '' && (
            <TypingIndicator />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input footer */}
        <div className="p-4 bg-white border-t border-slate-200 shrink-0">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={() => handleSend()}
            disabled={generating}
            placeholder={
              activeResource 
                ? `Ask doubts about "${activeResource.title}"...` 
                : "Ask AI Tutor a question..."
            }
          />
          {error && (
            <div className="mt-2 flex items-center space-x-1.5 text-red-655 text-xs bg-red-50 p-2 rounded-lg border border-red-100 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AITutor;
