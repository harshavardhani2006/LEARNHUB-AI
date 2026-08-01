import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an unhandled rendering crash:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="bg-white border border-slate-200 rounded-card p-8 max-w-md w-full shadow-lg space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-red-100">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-heading font-bold text-slate-900">Application Error</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Something went wrong while rendering this page. This could be due to a connection drop or unexpected format mismatch.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-205 rounded-lg text-left font-mono text-[10px] text-slate-600 overflow-x-auto max-h-24 leading-normal">
              {this.state.error?.toString() || 'Unknown runtime error'}
            </div>

            <Button
              onClick={this.handleReset}
              className="w-full text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Return to Safety
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
