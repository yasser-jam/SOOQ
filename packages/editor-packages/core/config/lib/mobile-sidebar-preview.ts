"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/core/store";
import { isZonePreviewActive } from "./zone-selection";

/**
 * Open/close state for the mobile `Sidebar` block.
 *
 * On the mobile shell the sidebar is a drawer (the AppBar menu button opens it
 * via `menuAction: { type: "openDrawer" }`), not a docked rail — so the editor
 * canvas must not render it pinned over the page with no way to dismiss it.
 * It stays closed until either:
 *   - the Sidebar block (or any block nested in it) is selected, so editing its
 *     contents from the outline/tree reveals it, or
 *   - the AppBar menu button in the canvas is clicked (`emitMobileSidebar`).
 *
 * The channel is a module-level pub/sub rather than a DOM event because the
 * AppBar and the Sidebar can end up in different documents (the editor renders
 * the canvas inside an iframe) while sharing one JS context.
 */
export type MobileSidebarAction = "open" | "close" | "toggle";

type Listener = (action: MobileSidebarAction) => void;

const listeners = new Set<Listener>();

export function emitMobileSidebar(action: MobileSidebarAction): void {
  listeners.forEach((listener) => listener(action));
}

export function useMobileSidebarPreview(componentId?: string) {
  const selected = useAppStore((s) =>
    isZonePreviewActive(s.state, s.state.ui.itemSelector, componentId)
  );

  const [isOpen, setIsOpen] = useState(false);

  // Selecting the sidebar (or something inside it) reveals it; closing it
  // afterwards keeps working because selection only pushes it open once.
  useEffect(() => {
    if (selected) setIsOpen(true);
  }, [selected]);

  useEffect(() => {
    const listener: Listener = (action) => {
      setIsOpen((open) => (action === "toggle" ? !open : action === "open"));
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((open) => !open), []);

  return { isOpen, selected, close, toggle };
}
