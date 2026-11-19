"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches WebGL context creation errors or Three.js runtime crashes.
 * Ensures that 2D views remain 100% functional even if WebGL fails.
 */
export class SceneErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Three.js Scene Error caught by SceneErrorBoundary:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 rounded-xl bg-neutral-900 border border-neutral-800 text-center text-white space-y-4 my-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-base font-semibold text-neutral-100">
              3D WebGL Visualization Unavailable
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Hardware acceleration or WebGL 2.0 context is unavailable in this environment.
              All 2D dashboard panels, charts, matrix analyses, and financial calculations remain fully functional.
            </p>
            {this.state.error && (
              <p className="text-[11px] font-mono text-neutral-500 bg-neutral-950 p-2 rounded text-left overflow-x-auto">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-900 hover:bg-white transition-colors"
            >
              Retry 3D Initialization
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
