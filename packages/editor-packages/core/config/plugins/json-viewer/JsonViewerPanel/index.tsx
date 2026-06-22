"use client";

import { useState, useCallback, useMemo } from "react";
import { createUsePuck } from "@/core";
import { normalizeEditorData } from "../../../lib/normalize-editor-data";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";
import { cn } from "@workspace/ui/lib/utils";
import { Copy, Check, Download, Eye, EyeOff } from "lucide-react";

const getClassName = getClassNameFactory("JsonViewerPanel", styles);

export function JsonViewerPanel() {
  const usePuck = createUsePuck();
  const data = usePuck((s) => s.appState.data as any);
  const [copied, setCopied] = useState(false);
  const [showNormalized, setShowNormalized] = useState(false);

  const displayData = useMemo(() => {
    if (!data) return null;
    if (showNormalized) {
      return normalizeEditorData(data);
    }
    return data;
  }, [data, showNormalized]);

  const jsonString = useMemo(() => {
    if (!displayData) return "";
    return JSON.stringify(displayData, null, 2);
  }, [displayData]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [jsonString]);

  const handleDownload = useCallback(() => {
    if (typeof window === "undefined") return;
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "page-data.json";
    link.click();
    window.URL.revokeObjectURL(url);
  }, [jsonString]);

  return (
    <div className={getClassName()}>
      <div className={getClassName("header")}>
        <span className={getClassName("headerTitle")}>JSON Viewer</span>
        <span className={getClassName("headerSubtitle")}>
          Live page data — updates as you edit
        </span>
      </div>

      <div className={getClassName("toolbar")}>
        <button
          type="button"
          className={cn(
            getClassName("toolbarButton"),
            getClassName({ toolbarButtonActive: showNormalized })
          )}
          onClick={() => setShowNormalized((v) => !v)}
          title={showNormalized ? "Show raw data" : "Show normalized data"}
        >
          {showNormalized ? <EyeOff size={14} /> : <Eye size={14} />}
          {showNormalized ? "Normalized" : "Raw"}
        </button>

        <button
          type="button"
          className={getClassName("toolbarButton")}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>

        <button
          type="button"
          className={getClassName("toolbarButton")}
          onClick={handleDownload}
          title="Download JSON"
        >
          <Download size={14} />
          Download
        </button>
      </div>

      <div className={getClassName("preWrap")} dir="ltr">
        <pre className={getClassName("pre")}>
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
