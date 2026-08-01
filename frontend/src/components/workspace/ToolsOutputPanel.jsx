import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, Check, Sparkles, AlertCircle, FileText } from 'lucide-react';

// Dynamic Mermaid rendering helper
// Accepts onSvgReady so the parent can grab the SVG string for download
const MermaidRenderer = ({ chart, onSvgReady }) => {
  const containerRef = useRef(null);
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const renderChart = async () => {
      try {
        if (!window.mermaid) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        window.mermaid.initialize({
          startOnLoad: false,
          theme: 'neutral',
          securityLevel: 'loose',
          flowchart: { useMaxWidth: true, htmlLabels: true }
        });

        const id = `mermaid-${Math.floor(Math.random() * 100000)}`;
        const { svg: renderedSvg } = await window.mermaid.render(id, chart);

        if (isMounted) {
          setSvg(renderedSvg);
          setError('');
          if (onSvgReady) onSvgReady(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid render error:', err);
        if (isMounted) setError('Failed to parse or render flowchart syntax.');
      }
    };

    if (chart) renderChart();
    return () => { isMounted = false; };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 border border-red-100 bg-red-50 text-red-655 text-xs rounded-lg flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="p-4 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto flex justify-center shadow-inner"
      dangerouslySetInnerHTML={{ __html: svg || '<p class="text-xs text-slate-400">Rendering flowchart...</p>' }}
    />
  );
};

export const ToolsOutputPanel = ({ type, data }) => {
  const [copied, setCopied] = useState(false);
  // Holds the rendered SVG string for diagram download
  const [diagramSvg, setDiagramSvg] = useState('');

  // Reset SVG whenever new diagram data arrives
  useEffect(() => {
    if (type !== 'diagram') setDiagramSvg('');
  }, [type, data]);

  if (!data) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center py-12">
        <Sparkles className="w-8 h-8 mb-3 text-slate-300 animate-float" />
        <p className="text-sm font-medium">Select an AI Study Tool from the menu</p>
        <p className="text-xs mt-1">Get summaries, mock exams, or flowcharts instantly.</p>
      </div>
    );
  }

  // Error state
  if (data._error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6">
        <AlertCircle className="w-8 h-8 mb-3 text-red-400" />
        <p className="text-sm font-semibold text-slate-700 mb-1">AI Tool Failed</p>
        <p className="text-xs text-slate-500 leading-relaxed">{data._error}</p>
      </div>
    );
  }

  const handleCopy = () => {
    let copyText = '';
    if (type === 'summary') {
      copyText = `${data.summary}\n\nTopics:\n${data.key_topics.map(t => `- ${t}`).join('\n')}`;
    } else if (type === 'questions') {
      copyText = data.questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
    } else if (type === 'revision') {
      copyText = `### Definitions\n${data.definitions.map(d => `- ${d}`).join('\n')}\n\n### Concepts\n${data.concepts.map(c => `- ${c}`).join('\n')}`;
    } else if (type === 'diagram') {
      copyText = data.diagram;
    }
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    // Diagram: download rendered SVG image, not markdown
    if (type === 'diagram') {
      if (!diagramSvg) return;
      const blob = new Blob([diagramSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'concept-diagram.svg');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    // All other types: download as markdown
    let content = '';
    let filename = `study-${type}.md`;

    if (type === 'summary') {
      content = `# Document Summary\n\n${data.summary}\n\n## Key Topics\n${data.key_topics.map(t => `- ${t}`).join('\n')}\n\n* Difficulty: ${data.difficulty}\n* Estimated Reading Time: ${data.reading_time}`;
    } else if (type === 'questions') {
      content = `# Exam Questions\n\n${data.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    } else if (type === 'revision') {
      content = `# Revision Sheet\n\n## Definitions\n${data.definitions.map(d => `- ${d}`).join('\n')}\n\n## Key Concepts\n${data.concepts.map(c => `- ${c}`).join('\n')}\n\n## Formulas & Rules\n${data.formulas.map(f => `- ${f}`).join('\n')}\n\n## Study Notes\n${data.notes.map(n => `- ${n}`).join('\n')}`;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-card shadow-sm p-6 space-y-6 flex flex-col h-full animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
        <h3 className="font-heading font-bold text-slate-800 text-sm capitalize flex items-center">
          <FileText className="w-4 h-4 mr-1.5 text-primary" />
          {type === 'revision' ? 'Revision Notes' : `${type} Output`}
        </h3>
        <div className="flex items-center space-x-1">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-655 transition-colors border border-transparent hover:border-slate-200"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            disabled={type === 'diagram' && !diagramSvg}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-655 transition-colors border border-transparent hover:border-slate-200 disabled:opacity-40"
            title={type === 'diagram' ? 'Download as SVG' : 'Download as Markdown'}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-sm leading-relaxed text-slate-700">

        {/* Summary */}
        {type === 'summary' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl">
              <p className="text-slate-800 font-medium italic">{data.summary}</p>
            </div>
            {data.key_topics && data.key_topics.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wider">Key Topics Covered</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {data.key_topics.map((topic, i) => <li key={i} className="text-slate-600">{topic}</li>)}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Estimated Reading Time</span>
                <span className="font-bold text-slate-800">{data.reading_time || 'N/A'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <span className="text-slate-400 block mb-0.5">Difficulty Profile</span>
                <span className="font-bold text-slate-800">{data.difficulty || 'Intermediate'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Questions */}
        {type === 'questions' && (
          <div className="space-y-3.5">
            {data.questions && data.questions.map((q, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100 bg-white">
                <span className="font-bold text-primary text-xs shrink-0 mt-0.5 w-5 h-5 rounded-full bg-primary/5 flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="text-slate-700 font-medium text-xs leading-relaxed">{q}</span>
              </div>
            ))}
          </div>
        )}

        {/* Revision Notes */}
        {type === 'revision' && (
          <div className="space-y-6">
            {data.definitions && data.definitions.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wider border-l-2 border-primary pl-2">Key Definitions</h4>
                <div className="grid gap-2">
                  {data.definitions.map((def, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-150 text-xs">{def}</div>
                  ))}
                </div>
              </div>
            )}
            {data.concepts && data.concepts.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wider border-l-2 border-primary pl-2">Core Concepts</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-655">
                  {data.concepts.map((concept, i) => <li key={i}>{concept}</li>)}
                </ul>
              </div>
            )}
            {data.formulas && data.formulas.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wider border-l-2 border-primary pl-2">Rules & Formulas</h4>
                <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-x-auto leading-relaxed">
                  {data.formulas.map((rule, i) => <div key={i} className="mb-1 last:mb-0">• {rule}</div>)}
                </div>
              </div>
            )}
            {data.notes && data.notes.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="font-heading font-bold text-slate-900 text-xs uppercase tracking-wider border-l-2 border-primary pl-2">Study Reminders</h4>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-500">
                  {data.notes.map((note, i) => <li key={i}>{note}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Diagram */}
        {type === 'diagram' && (
          <div className="space-y-4">
            <MermaidRenderer chart={data.diagram} onSvgReady={setDiagramSvg} />
            <div className="p-4 border border-slate-150 rounded-xl bg-slate-50">
              <h4 className="font-heading font-bold text-xs text-slate-900 mb-1">Flowchart Explanation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{data.explanation}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ToolsOutputPanel;
