"use client";
import React, { Component, type ErrorInfo, type ReactNode } from "react";

type FallbackRenderer = (error: Error, reset: () => void) => ReactNode;

type Props = {
  children: ReactNode;
  fallback: FallbackRenderer;
  onError?: (error: Error, info: ErrorInfo) => void;
};

type State = { error: Error | null };

/**
 * Catches render errors from a single block so one broken component can't
 * take down the whole editor canvas (or the rendered storefront). Used at
 * three levels: per-block in edit mode (DropZoneChild), per-item in render
 * mode (DropZoneRenderItem / SlotRender), and around the entire canvas in
 * Preview.
 */
export class BlockErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.reset);
    }

    return this.props.children;
  }
}

/**
 * Edit-mode fallback card: keeps the broken block visible, selectable and
 * recoverable instead of white-screening the editor.
 */
export const BlockErrorCard = ({
  componentType,
  error,
  onRetry,
}: {
  componentType: string;
  error: Error;
  onRetry: () => void;
}) => (
  <div
    dir="rtl"
    style={{
      border: "1px dashed var(--puck-color-red-05, #dc2626)",
      borderRadius: 8,
      background: "var(--puck-color-red-11, #fef2f2)",
      color: "var(--puck-color-red-03, #991b1b)",
      padding: 16,
      minHeight: 64,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      fontSize: 14,
      textAlign: "right",
    }}
  >
    <strong>تعذّر عرض هذا العنصر ({componentType})</strong>
    <code
      dir="ltr"
      style={{
        fontSize: 12,
        opacity: 0.8,
        overflowWrap: "anywhere",
        textAlign: "left",
      }}
    >
      {error.message}
    </code>
    <div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          border: "1px solid currentColor",
          borderRadius: 6,
          background: "transparent",
          color: "inherit",
          padding: "4px 12px",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  </div>
);
