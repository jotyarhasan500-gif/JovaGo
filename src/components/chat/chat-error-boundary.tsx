"use client";

import { Component, type ReactNode } from "react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/** Catches errors in the chat window (e.g. Message List) and shows a fallback instead of crashing the whole page. */
export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ChatErrorBoundary] Caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-sm font-medium text-foreground">Something went wrong in the chat.</p>
          <p className="text-xs text-muted-foreground">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="text-sm text-[#0066FF] hover:underline"
          >
            Try again
          </button>
          <Link href="/chat" className="text-sm text-[#0066FF] hover:underline">
            Back to chat
          </Link>
        </div>
      );
    }
    return this.props.children;
  }
}
