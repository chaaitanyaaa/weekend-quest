import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-cream dark:bg-navy-dark text-navy dark:text-cream flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-navy-card rounded-3xl p-8 border border-navy/10 dark:border-white/10 shadow-lifted text-center">
            <div className="w-14 h-14 rounded-2xl bg-coral/15 text-coral grid place-items-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="font-display font-extrabold text-2xl mb-2">
              Something went slightly sideways
            </h2>
            <p className="text-sm text-navy/60 dark:text-cream/60 mb-6">
              Don't worry, your weekend quests and circles are completely safe!
            </p>
            {this.state.error && (
              <div className="bg-cream-2 dark:bg-navy rounded-xl p-3 text-left font-mono text-xs text-rose-500 overflow-x-auto mb-6">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="w-full h-12 rounded-xl bg-coral text-cream font-bold text-sm shadow-coral hover:bg-coral-dark inline-flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Reload Weekend Quest
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
