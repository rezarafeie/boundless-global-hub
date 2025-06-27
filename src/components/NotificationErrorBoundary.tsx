
import React from 'react';

interface NotificationErrorBoundaryProps {
  children: React.ReactNode;
}

interface NotificationErrorBoundaryState {
  hasError: boolean;
}

class NotificationErrorBoundary extends React.Component<
  NotificationErrorBoundaryProps,
  NotificationErrorBoundaryState
> {
  constructor(props: NotificationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): NotificationErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Notification error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render nothing to prevent layout issues
      return null;
    }

    return this.props.children;
  }
}

export default NotificationErrorBoundary;
