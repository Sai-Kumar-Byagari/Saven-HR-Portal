import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logService } from '@/services/logService';
import PageErrorFallback from './PageErrorFallback';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: { error: Error | null; onReset: () => void }) => ReactNode);
  context?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logService.error(error.message, {
      context: this.props.context || 'ErrorBoundary',
      stack: error.stack,
      metadata: { componentStack: info.componentStack ?? undefined },
    });
    this.props.onError?.(error, info);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === 'function') {
        return fallback({ error: this.state.error, onReset: this.handleReset });
      }

      if (fallback) {
        return fallback;
      }

      return <PageErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}
