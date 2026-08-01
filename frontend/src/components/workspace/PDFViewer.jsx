import React, { useRef, useState, useEffect } from 'react';
import { Download, Maximize2, Minimize2, ZoomIn, ZoomOut, FileText, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const PDFViewer = ({ fileUrl, resourceId, title }) => {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  // resolvedUrl: the final URL we pass to the iframe (null = still resolving)
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (!resourceId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setResolvedUrl(null);

    const resolve = async () => {
      // Always get the auth token — needed for the proxy fallback
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const proxyUrl = `${apiBase}/resources/${resourceId}/file${token ? `?token=${token}` : ''}`;

      // Check if fileUrl is a real Supabase public URL and actually serves a PDF
      const isSupabasePublic = fileUrl &&
        fileUrl.startsWith('http') &&
        fileUrl.includes('/object/public/');

      if (isSupabasePublic) {
        try {
          // HEAD request to confirm the file exists and is a PDF (not a JSON error page)
          const head = await fetch(fileUrl, { method: 'HEAD' });
          const ct = head.headers.get('content-type') || '';
          if (head.ok && ct.includes('pdf')) {
            // Direct CDN path — fast
            if (!cancelled) {
              setResolvedUrl(fileUrl);
              setLoading(false);
            }
            return;
          }
        } catch (_) {
          // HEAD failed (CORS etc.) — fall through to proxy
        }
      }

      // Proxy path — always works since backend handles auth + storage
      if (!cancelled) {
        setResolvedUrl(proxyUrl);
        setLoading(false);
      }
    };

    resolve().catch(err => {
      if (!cancelled) {
        setError(err.message || 'Failed to load document.');
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [resourceId, fileUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error('Fullscreen failed:', err));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    if (!resolvedUrl) return;
    const link = document.createElement('a');
    link.href = resolvedUrl;
    link.setAttribute('download', `${title || 'document'}.pdf`);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-100 rounded-card border border-slate-200 overflow-hidden flex flex-col h-full ${
        isFullscreen ? 'p-0 w-screen h-screen rounded-none border-0' : 'h-[600px] md:h-full'
      }`}
    >
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-2 min-w-0">
          <FileText className="w-5 h-5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-slate-800 truncate" title={title}>
            {title || 'Document Viewer'}
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => setZoom(prev => Math.max(50, prev - 10))}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-medium px-1 select-none">{zoom}%</span>
          <button
            onClick={() => setZoom(prev => Math.min(200, prev + 10))}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-200 mx-1" />

          <button
            onClick={handleDownload}
            disabled={!resolvedUrl}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-40"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full h-full relative bg-slate-700">

        {/* Loading */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-700 z-10">
            <div className="text-center text-slate-300 space-y-2">
              <Loader className="w-7 h-7 animate-spin mx-auto text-slate-400" />
              <p className="text-xs">Loading document...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-700 z-10">
            <div className="text-center text-slate-300 space-y-3 px-6">
              <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
              <p className="text-sm font-semibold">Could not load document</p>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          </div>
        )}

        {/* iframe — only mounts once resolvedUrl is confirmed valid */}
        {resolvedUrl && !loading && !error && (
          <iframe
            src={`${resolvedUrl}#zoom=${zoom}`}
            title={title || 'Document Viewer'}
            className="w-full h-full border-0 absolute inset-0"
          />
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
