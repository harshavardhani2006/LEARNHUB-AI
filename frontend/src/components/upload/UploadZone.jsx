import React, { useState, useRef } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['pdf', 'docx', 'doc', 'txt'];
const MAX_FILE_SIZE_MB = 20;

export const UploadZone = ({ onFileSelect, selectedFile, onClearFile }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!file) return false;
    
    const ext = file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError(`Unsupported file format. Please upload PDF, DOCX, or TXT.`);
      return false;
    }
    
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      setError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    
    setError('');
    return true;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  };

  const handleClickZone = () => {
    fileInputRef.current.click();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
      />

      {selectedFile ? (
        // File selected card view
        <div className="border border-slate-200 rounded-card p-4 bg-slate-50 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <File className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate" title={selectedFile.name}>
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatBytes(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onClearFile}
            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      ) : (
        // Active Drop Area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClickZone}
          className={`border-2 border-dashed rounded-card p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner'
              : 'border-slate-300 hover:border-slate-400 bg-white hover:shadow-sm'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Upload className={`w-6 h-6 ${isDragOver ? 'text-primary' : 'text-slate-400'}`} />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            Drag and drop your study sheet here
          </p>
          <p className="text-xs text-slate-500 mt-1">
            or <span className="text-primary font-medium">browse local files</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-4">
            Supports PDF, DOCX, TXT up to 20MB
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-xs bg-red-50 px-3 py-2 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default UploadZone;
