import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { supabase } from '../services/supabase';
import PDFViewer from '../components/workspace/PDFViewer';
import AIToolCard from '../components/workspace/AIToolCard';
import ToolsOutputPanel from '../components/workspace/ToolsOutputPanel';
import ChatMessage from '../components/chat/ChatMessage';
import ChatInput from '../components/chat/ChatInput';
import TypingIndicator from '../components/chat/TypingIndicator';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { 
  ArrowLeft, Heart, Eye, Calendar, Sparkles, MessageSquare, 
  ChevronRight, ChevronLeft, Bot, RefreshCw, Send 
} from 'lucide-react';

export const ResourceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Resource & Owner Info
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Likes & Views (Optimistic UI)
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  // Resize state
  const [leftWidth, setLeftWidth] = useState(60); // percentage
  const isDragging = useRef(false);

  // Mobile Tabs: 'doc' | 'ai'
  const [mobileTab, setMobileTab] = useState('doc');

  // Right Panel Tabs: 'tools' | 'chat'
  const [workspaceTab, setWorkspaceTab] = useState('tools');

  // AI Study Tools state
  const [activeTool, setActiveTool] = useState(null); // 'summary' | 'questions' | 'revision' | 'diagram'
  const [toolData, setToolData] = useState(null);
  const [toolLoading, setToolLoading] = useState(false);
  const [diagramTopic, setDiagramTopic] = useState('');

  // Embedded Ask Doubts Chat state
  const [chatConvId, setChatConvId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatGenerating, setChatGenerating] = useState(false);
  const [chatError, setChatError] = useState('');
  const chatEndRef = useRef(null);

  // 1. Fetch resource metadata on load
  const fetchResource = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use sessionStorage to deduplicate view increments within the same session.
      // First visit → count the view. Subsequent visits in the same tab session → skip increment.
      const sessionKey = `viewed_${id}`;
      const alreadyViewed = sessionStorage.getItem(sessionKey);
      const url = alreadyViewed ? `/resources/${id}?no_increment=true` : `/resources/${id}`;

      const res = await api.get(url);
      setResource(res.data);
      setLikesCount(res.data.likes || 0);

      // Mark as viewed for this session after first successful fetch
      if (!alreadyViewed) {
        sessionStorage.setItem(sessionKey, '1');
      }
    } catch (err) {
      console.error(err);
      setError('Resource not found or failed to load details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResource();
  }, [fetchResource]);

  // 2. Fetch or create a chat session scoped to this resource
  const initResourceChat = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      // Check if there is an existing conversation for this user linked to this resource
      const resList = await api.get(`/conversations/${userId}`);
      const existing = resList.data.conversations?.find(c => c.resource_id === id);

      if (existing) {
        setChatConvId(existing.id);
        // Load messages
        const resMsgs = await api.get(`/messages/${existing.id}`);
        setChatMessages(resMsgs.data.messages || []);
      } else {
        // Create new scoped conversation
        const resCreate = await api.post('/conversations', {
          title: `Chat: ${resource?.title || 'Study Sheet'}`,
          resource_id: id
        });
        setChatConvId(resCreate.data.id);
        setChatMessages([]);
      }
    } catch (err) {
      console.error('Failed to initialize scoped chat:', err);
    }
  }, [id, resource]);

  useEffect(() => {
    if (resource && workspaceTab === 'chat' && !chatConvId) {
      initResourceChat();
    }
  }, [resource, workspaceTab, chatConvId, initResourceChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatGenerating]);

  // 3. Resize panel mouse handlers
  const handleMouseDown = () => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      const percentage = (e.clientX / window.innerWidth) * 100;
      if (percentage > 25 && percentage < 80) {
        setLeftWidth(percentage);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 4. Like button click with optimistic UI updates
  const handleLike = async () => {
    if (hasLiked) return; // Prevent double clicks
    
    // Optimistic UI update
    setLikesCount(prev => prev + 1);
    setHasLiked(true);

    try {
      await api.post(`/resources/${id}/like`);
    } catch (err) {
      // Revert if API fails
      setLikesCount(prev => Math.max(0, prev - 1));
      setHasLiked(false);
      console.error(err);
    }
  };

  // 5. Run AI Study Tools
  const runStudyTool = async (toolType) => {
    setActiveTool(toolType);
    setToolLoading(true);
    setToolData(null);

    let endpoint = '/summarize';
    let body = { resource_id: id };

    if (toolType === 'questions') endpoint = '/generate-questions';
    else if (toolType === 'revision') endpoint = '/generate-revision-notes';
    else if (toolType === 'diagram') {
      endpoint = '/generate-diagram';
      body.topic = diagramTopic.trim() || 'Core workflow structure';
    }

    try {
      const response = await api.post(endpoint, body);
      setToolData(response.data);
    } catch (err) {
      console.error(err);
      // Pass null so ToolsOutputPanel shows the "select a tool" empty state,
      // then separately surface the error message in the output area.
      const detail = err.response?.data?.detail || err.message || 'AI processing failed. Please try again.';
      setToolData({ _error: detail });
    } finally {
      setToolLoading(false);
    }
  };

  // 6. Send message in Scoped Chat
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || !chatConvId) return;

    const text = chatInput;
    setChatInput('');
    setChatGenerating(true);
    setChatError('');

    // Append optimistic user bubble
    const userMsg = { id: 'temp-u', sender: 'user', message: text };
    setChatMessages(prev => [...prev, userMsg]);
    
    // Append placeholder assistant bubble
    const assistantMsgPlaceholder = { id: 'temp-a', sender: 'assistant', message: '' };
    setChatMessages(prev => [...prev, assistantMsgPlaceholder]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Stream response using fetch SSE
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: chatConvId,
          message: text,
          resource_id: id
        })
      });

      if (!response.ok) throw new Error();

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            try {
              const data = JSON.parse(line.substring(5).trim());
              if (data.done) break;
              if (data.token) {
                answer += data.token;
                setChatMessages(prev =>
                  prev.map(m => m.id === 'temp-a' ? { ...m, message: answer } : m)
                );
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setChatError('Failed to fetch streamed answer.');
      setChatMessages(prev =>
        prev.map(m => m.id === 'temp-a' ? { ...m, message: '⚠️ Error: Connection failed.' } : m)
      );
    } finally {
      setChatGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" className="w-1/3" />
        <Skeleton variant="card" className="h-96" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 font-medium mb-4">{error || 'Resource not found'}</p>
        <Link to="/resources">
          <Button variant="secondary">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-4">
      {/* Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-card px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link to="/resources" className="text-xs text-slate-400 hover:text-slate-655 font-medium flex items-center transition-colors">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Library
            </Link>
            <span className="text-slate-300">/</span>
            <Badge subject={resource.subject}>{resource.subject}</Badge>
          </div>
          <h1 className="font-heading font-bold text-lg text-slate-900 leading-tight">
            {resource.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-[10px] font-medium">
            <span className="text-slate-500 font-semibold">{resource.uploader_name || 'Anonymous'}</span>
            <span>•</span>
            <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1" /> {new Date(resource.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1" /> {resource.views} views</span>
          </div>
        </div>

        {/* Action button likes */}
        <div className="shrink-0">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-full text-xs font-semibold shadow-sm transition-all duration-300 active:scale-95 ${
              hasLiked
                ? 'bg-red-50 border-red-200 text-red-500 shadow-inner'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-500 hover:border-red-200'
            }`}
          >
            <Heart className={`w-4 h-4 transition-transform duration-300 ${hasLiked ? 'fill-red-500 scale-110' : 'group-hover:scale-110'}`} />
            <span>{likesCount} Likes</span>
          </button>
        </div>
      </div>

      {/* Desktop side-by-side resizable workspace */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Desktop Split Divider Views */}
        <div className="hidden md:flex w-full h-full">
          {/* Left: PDF Document panel */}
          <div style={{ width: `${leftWidth}%` }} className="h-full shrink-0">
            <PDFViewer 
              fileUrl={resource.file_url} 
              resourceId={resource.id} 
              title={resource.title} 
            />
          </div>

          {/* Draggable resize bar */}
          <div
            onMouseDown={handleMouseDown}
            className="w-2 hover:w-3 hover:bg-primary/20 cursor-col-resize flex items-center justify-center transition-all bg-transparent z-20 shrink-0"
            title="Drag to resize panel"
          >
            <div className="w-1 h-8 bg-slate-300 rounded" />
          </div>

          {/* Right: AI Tools Workspace Panel */}
          <div style={{ width: `${100 - leftWidth}%` }} className="h-full flex flex-col bg-white border border-slate-200 rounded-card overflow-hidden shadow-sm shrink-0">
            {renderRightWorkspacePanel()}
          </div>
        </div>

        {/* Mobile View: Tabbed Layout */}
        <div className="flex md:hidden flex-col w-full h-full">
          {/* Tab buttons */}
          <div className="grid grid-cols-2 border border-slate-200 rounded-lg overflow-hidden shrink-0 mb-3 bg-white">
            <button
              onClick={() => setMobileTab('doc')}
              className={`py-2 text-xs font-semibold transition-all ${
                mobileTab === 'doc' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              Document
            </button>
            <button
              onClick={() => setMobileTab('ai')}
              className={`py-2 text-xs font-semibold transition-all ${
                mobileTab === 'ai' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              AI Workspace
            </button>
          </div>

          {/* Tab viewport */}
          <div className="flex-1 overflow-hidden">
            {mobileTab === 'doc' ? (
              <PDFViewer 
                fileUrl={resource.file_url} 
                resourceId={resource.id} 
                title={resource.title} 
              />
            ) : (
              <div className="h-full flex flex-col bg-white border border-slate-200 rounded-card overflow-hidden shadow-sm">
                {renderRightWorkspacePanel()}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );

  // Renders the AI Tools and Chat switcher panel
  function renderRightWorkspacePanel() {
    return (
      <>
        {/* Swapper tab header */}
        <div className="flex border-b border-slate-200 shrink-0 bg-slate-50">
          <button
            onClick={() => setWorkspaceTab('tools')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-2 ${
              workspaceTab === 'tools'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Study Tools</span>
          </button>
          <button
            onClick={() => setWorkspaceTab('chat')}
            className={`flex-1 py-3 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-2 ${
              workspaceTab === 'chat'
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Ask Doubts</span>
          </button>
        </div>

        {/* Tab content wrapper */}
        <div className="flex-1 overflow-hidden">
          
          {/* TAB 1: AI Study Tools */}
          {workspaceTab === 'tools' && (
            <div className="h-full flex flex-col md:flex-row overflow-hidden">
              {/* Tool Selection deck (Scrollable left column inside right workspace) */}
              <div className="w-full md:w-48 border-r border-slate-100 p-4 space-y-2 overflow-y-auto shrink-0 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">AI Assistants</p>
                <AIToolCard
                  type="summary"
                  title="Summarize"
                  description="Generate 5-line summary + key topics."
                  active={activeTool === 'summary'}
                  loading={activeTool === 'summary' && toolLoading}
                  onClick={() => runStudyTool('summary')}
                />
                <AIToolCard
                  type="questions"
                  title="Mock Exam"
                  description="Extract 10 testing questions."
                  active={activeTool === 'questions'}
                  loading={activeTool === 'questions' && toolLoading}
                  onClick={() => runStudyTool('questions')}
                />
                <AIToolCard
                  type="revision"
                  title="Revision Notes"
                  description="Definitions, formulas & concept notes."
                  active={activeTool === 'revision'}
                  loading={activeTool === 'revision' && toolLoading}
                  onClick={() => runStudyTool('revision')}
                />
                
                {/* Diagram prompt wrapper */}
                <div className="pt-2 border-t border-slate-100 mt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Diagrams</p>
                  <input
                    type="text"
                    placeholder="e.g. Normalization flow"
                    value={diagramTopic}
                    onChange={(e) => setDiagramTopic(e.target.value)}
                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none mb-2 placeholder:text-slate-400 text-slate-700 bg-white"
                  />
                  <AIToolCard
                    type="diagram"
                    title="Draw Flowchart"
                    description="Visualize concept relations."
                    active={activeTool === 'diagram'}
                    loading={activeTool === 'diagram' && toolLoading}
                    onClick={() => runStudyTool('diagram')}
                  />
                </div>
              </div>

              {/* Output Results Board */}
              <div className="flex-1 h-full overflow-hidden p-4">
                <ToolsOutputPanel type={activeTool} data={toolData} />
              </div>
            </div>
          )}

          {/* TAB 2: Embedded Ask Doubts Chat Panel */}
          {workspaceTab === 'chat' && (
            <div className="h-full flex flex-col overflow-hidden bg-slate-50">
              {/* Message scroll viewport */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-xs mx-auto">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-float">
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-heading font-semibold text-slate-800">Ask the Document AI</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Query equations, ask for analogies, or get explanations grounded strictly in this document.
                      </p>
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, index) => (
                  <ChatMessage key={index} message={msg} />
                ))}
                {chatGenerating && chatMessages[chatMessages.length - 1]?.message === '' && (
                  <TypingIndicator />
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Send Footer */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0">
                <ChatInput
                  value={chatInput}
                  onChange={setChatInput}
                  onSend={handleSendChatMessage}
                  disabled={chatGenerating}
                  placeholder="Ask a question about this document..."
                />
                {chatError && (
                  <div className="text-red-500 text-[10px] mt-1 font-medium">{chatError}</div>
                )}
              </div>
            </div>
          )}

        </div>
      </>
    );
  }
};

export default ResourceDetail;
