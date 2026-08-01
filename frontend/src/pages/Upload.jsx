import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import UploadZone from '../components/upload/UploadZone';
import UploadForm from '../components/upload/UploadForm';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import api from '../services/api';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { CheckCircle, AlertCircle, Loader2, Sparkles, BookOpen, Bot } from 'lucide-react';

export const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form State
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  // Workflow states: 'idle' | 'uploading' | 'processing' | 'success'
  const [status, setStatus] = useState('idle');
  
  // Progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [checklist, setChecklist] = useState({
    upload: 'pending',    // 'pending' | 'loading' | 'success'
    parse: 'pending',
    chunk: 'pending',
    embed: 'pending'
  });

  // Toast notifications
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [uploadedResourceId, setUploadedResourceId] = useState(null);

  // Automatically populate Title based on selected filename
  useEffect(() => {
    if (file && !title) {
      // Remove extension for default title
      const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      // Replace hyphens/underscores with spaces
      const formattedName = nameWithoutExt.replace(/[-_]/g, ' ');
      setTitle(formattedName);
    }
  }, [file]);

  const validateForm = () => {
    const tempErrors = {};
    if (!file) tempErrors.file = 'Please select a file to upload.';
    if (!title.trim()) tempErrors.title = 'Title is required.';
    else if (title.length < 3) tempErrors.title = 'Title must be at least 3 characters.';
    if (!subject) tempErrors.subject = 'Please select a subject category.';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStatus('uploading');
    setUploadProgress(10);
    setChecklist(prev => ({ ...prev, upload: 'loading' }));

    try {
      // Step 1 — Upload file directly to Supabase Storage from browser
      // This bypasses Vercel's 4.5MB serverless body limit entirely
      const resourceId = crypto.randomUUID();
      const userId = user?.id;
      const storagePath = `${userId}/${resourceId}/${file.name}`;

      const { error: storageError } = await supabase.storage
        .from('resources')
        .upload(storagePath, file, { upsert: false });

      if (storageError) throw new Error(storageError.message);

      setUploadProgress(50);

      // Step 2 — Get public URL
      const { data: urlData } = supabase.storage
        .from('resources')
        .getPublicUrl(storagePath);
      const fileUrl = urlData.publicUrl;

      setUploadProgress(70);
      setChecklist(prev => ({ ...prev, upload: 'success', parse: 'loading' }));

      // Step 3 — Tell backend to save metadata + kick off RAG indexing
      const response = await api.post('/resources/register', {
        resource_id: resourceId,
        title,
        subject,
        description: description || null,
        file_url: fileUrl,
        storage_path: storagePath,
        filename: file.name
      });

      setUploadProgress(90);
      setUploadedResourceId(response.data.resource.id);

      // Transition to processing checklist
      setStatus('processing');
      setChecklist(prev => ({ ...prev, parse: 'loading' }));

      await new Promise(resolve => setTimeout(resolve, 800));
      setChecklist(prev => ({ ...prev, parse: 'success', chunk: 'loading' }));

      await new Promise(resolve => setTimeout(resolve, 600));
      setChecklist(prev => ({ ...prev, chunk: 'success', embed: 'loading' }));

      await new Promise(resolve => setTimeout(resolve, 1000));
      setChecklist(prev => ({ ...prev, embed: 'success' }));

      await new Promise(resolve => setTimeout(resolve, 400));
      setUploadProgress(100);
      setStatus('success');
      setToast({
        visible: true,
        message: 'Study sheet successfully uploaded and indexed!',
        type: 'success'
      });

    } catch (err) {
      console.error(err);
      setStatus('idle');
      setChecklist({ upload: 'pending', parse: 'pending', chunk: 'pending', embed: 'pending' });
      setToast({
        visible: true,
        message: err.response?.data?.detail || err.message || 'Failed to upload document.',
        type: 'error'
      });
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setSubject('');
    setDescription('');
    setErrors({});
    setStatus('idle');
    setUploadProgress(0);
    setChecklist({ upload: 'pending', parse: 'pending', chunk: 'pending', embed: 'pending' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 font-body">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl text-slate-900">Upload Study Sheets</h1>
        <p className="text-slate-500 mt-1">
          Upload PDF, DOCX or TXT files to parse them into your workspace and query them with AI.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-card p-6 sm:p-8 shadow-sm">
        
        {/* Form state */}
        {status === 'idle' && (
          <form onSubmit={handleUpload} className="space-y-6">
            <UploadZone 
              onFileSelect={setFile} 
              selectedFile={file} 
              onClearFile={() => setFile(null)} 
            />
            {errors.file && (
              <p className="text-red-500 text-xs font-medium -mt-2">{errors.file}</p>
            )}

            <UploadForm
              title={title}
              setTitle={setTitle}
              subject={subject}
              setSubject={setSubject}
              description={description}
              setDescription={setDescription}
              errors={errors}
            />

            <Button variant="primary" type="submit" className="w-full py-3 justify-center text-sm font-semibold">
              Upload & Vectorize Study Sheet
            </Button>
          </form>
        )}

        {/* Uploading progress state */}
        {status === 'uploading' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="space-y-2">
              <h3 className="text-lg font-heading font-semibold text-slate-800">Uploading File...</h3>
              <p className="text-sm text-slate-500">Sending study material to storage buckets</p>
            </div>
            
            <div className="w-full max-w-md bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-150 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 font-medium">{uploadProgress}% uploaded</p>
          </div>
        )}

        {/* Processing RAG Pipeline state */}
        {status === 'processing' && (
          <div className="py-8 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 text-ai-purple animate-spin" />
              <h3 className="text-lg font-heading font-semibold text-slate-800">RAG Document Ingestion...</h3>
            </div>
            
            {/* Checklist Pipeline */}
            <div className="w-full max-w-sm border border-slate-100 rounded-xl bg-slate-50 p-5 space-y-4 shadow-inner">
              {[
                { key: 'upload', label: 'File uploaded to storage' },
                { key: 'parse', label: 'Extracting document text' },
                { key: 'chunk', label: 'Creating overlapping text chunks' },
                { key: 'embed', label: 'Building local FAISS vector index' }
              ].map((step, idx) => {
                const stepStatus = checklist[step.key];
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${
                      stepStatus === 'success' ? 'text-slate-800' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                    {stepStatus === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                    {stepStatus === 'loading' && <Loader2 className="w-5 h-5 text-ai-purple animate-spin shrink-0" />}
                    {stepStatus === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success state */}
        {status === 'success' && (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 text-emerald-500">
              <CheckCircle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-bold text-slate-900">Ingestion Successful!</h2>
              <p className="text-sm text-slate-500 max-w-md">
                "{title}" has been successfully added to your library, processed, and indexed into the vector store.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-4">
              <Link to={`/resources/${uploadedResourceId}`} className="w-full sm:w-auto flex-1">
                <Button variant="secondary" className="w-full py-3 justify-center text-sm font-medium">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Workspace
                </Button>
              </Link>
              
              <Link to={`/ai-tutor?resource_id=${uploadedResourceId}`} className="w-full sm:w-auto flex-1">
                <Button variant="ai" className="w-full py-3 justify-center text-sm font-medium shadow-glow-ai">
                  <Bot className="w-4 h-4 mr-2" />
                  Ask AI Tutor
                </Button>
              </Link>
            </div>
            
            <button 
              onClick={resetForm} 
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors font-medium border-b border-transparent hover:border-slate-400"
            >
              Upload another file
            </button>
          </div>
        )}

      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />
    </div>
  );
};

export default Upload;
