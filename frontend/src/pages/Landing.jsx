import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, Bot, Zap, ArrowRight, GitBranch, FileText, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Landing = () => {
  const features = [
    {
      title: 'Summarize',
      description: 'Auto 5-line summary and key topics generated after you upload a document.',
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-100',
    },
    {
      title: 'Important Questions',
      description: 'Extract potential exam or interview questions directly from your material.',
      icon: HelpCircle,
      color: 'text-purple-500',
      bg: 'bg-purple-100',
    },
    {
      title: 'Revision Notes',
      description: 'Concise bullet-point sheets, definitions, and formulas instantly prepared.',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
    },
    {
      title: 'Diagrams',
      description: 'Educational flowcharts and relationship diagrams created using AI.',
      icon: GitBranch,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
    },
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-6 lg:px-12 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-gradient-to-br from-ai-purple to-accent-cyan rounded-lg shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-heading font-bold text-slate-900 text-xl tracking-wide">
            LearnHub <span className="text-accent-cyan">AI</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Log in
          </Link>
          <Link to="/signup">
            <Button variant="primary">Get Started Free</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-6 lg:px-12 overflow-hidden bg-gradient-hero animate-gradient-shift">
        {/* Subtle animated floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ai-purple/30 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-cyan/20 rounded-full blur-[100px] animate-float" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm backdrop-blur-sm mb-4">
            <Sparkles className="w-4 h-4 text-accent-cyan" />
            <span>RAG-powered learning assistant</span>
          </div>
          
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight">
            Your collaborative <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-ai-purple">
              AI-powered learning workspace
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Upload study materials, learn with an interactive AI tutor, and revise smarter with auto-generated notes and diagrams.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/resources">
              <Button variant="secondary" className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20" size="lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Resources
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="ai" className="w-full sm:w-auto shadow-glow-ai" size="lg">
                <Bot className="w-5 h-5 mr-2" />
                Open AI Tutor
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section Stub */}
      <section className="py-12 bg-sidebar text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 divide-x divide-white/10">
          {[
            { label: 'Total Resources', value: '1,240+' },
            { label: 'Active Learners', value: '3,500+' },
            { label: 'Questions Answered', value: '50k+' },
            { label: 'Subjects Covered', value: '85+' },
          ].map((stat, i) => (
            <div key={i} className="px-4 text-center">
              <p className="text-3xl font-heading font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Study Tools Section */}
      <section className="py-24 px-6 lg:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-slate-900 mb-4">
              Supercharge your study sessions
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Our RAG pipeline analyzes your documents instantly to give you the exact tools you need to ace your next exam.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="group p-6 bg-surface border border-slate-100 rounded-card hover:shadow-xl hover:border-slate-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${feature.bg}`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-slate-900 mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 lg:px-12 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-accent-cyan" />
            <span className="font-heading font-bold text-white text-lg tracking-wide">
              LearnHub <span className="text-accent-cyan">AI</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm">
            <Link to="/resources" className="hover:text-white transition-colors">Resources</Link>
            <Link to="/ai-tutor" className="hover:text-white transition-colors">AI Tutor</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10 text-xs">
            Built with RAG + LLM
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
