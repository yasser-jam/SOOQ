export type EditorMode = "desktop" | "mobile";

let activeEditorMode: EditorMode = "desktop";

/** Set by the Design Studio client when `?mode=mobile` is active. */
export function setActiveEditorMode(mode: EditorMode): void {
  activeEditorMode = mode;
}

export function getActiveEditorMode(): EditorMode {
  return activeEditorMode;
}

export function parseEditorMode(
  value: string | null | undefined
): EditorMode {
  return value === "mobile" ? "mobile" : "desktop";
}

export function isMobileEditorMode(mode?: EditorMode): boolean {
  return (mode ?? activeEditorMode) === "mobile";
}

/** True when the Puck editor is in mobile mode (metadata or active mode). */
export function isMobileEditorMetadata(
  metadata?: { editorMode?: string } | null
): boolean {
  return (
    metadata?.editorMode === "mobile" || getActiveEditorMode() === "mobile"
  );
}
