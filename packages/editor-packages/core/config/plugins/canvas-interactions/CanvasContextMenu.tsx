"use client";
import React, { useCallback, useRef, useState } from "react";
import { ContextMenuPortal } from "./ContextMenuPortal";
import { useComponentActions } from "./lib/use-component-actions";
import { useContextMenuTarget } from "./lib/use-context-menu-target";
import { useMenuDismissal } from "./lib/use-menu-dismissal";
import { useCanvasShortcuts } from "./lib/use-canvas-shortcuts";
import type { MenuState } from "./lib/types";

/**
 * Wraps the entire Puck UI. Responsibilities (split per D-7):
 *   - `lib/use-component-actions` — reducer dispatches for every mutation
 *   - `lib/use-context-menu-target` — contextmenu listeners (outer + iframe)
 *   - `lib/use-menu-dismissal` — highlight, outside-click/Escape, viewport clamp
 *   - `lib/use-canvas-shortcuts` — global keyboard shortcuts
 *   - `ContextMenuPortal` — the popup UI
 *
 * Every mutation goes through the same reducer actions (insert, duplicate,
 * remove, replace, move), so every change lands in `store_config.json` —
 * no editor-only state, nothing an AI agent couldn't reproduce programmatically.
 */
export function CanvasInteractions({
  children,
}: {
  children: React.ReactNode;
}) {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform);
  const modKeyLabel = isMac ? "⌘" : "Ctrl";
  const deleteKeyLabel = isMac ? "⌫" : "Del";

  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const actions = useComponentActions();

  const openMenu = useCallback((next: MenuState) => setMenu(next), []);
  const closeMenu = useCallback(() => setMenu(null), []);

  useContextMenuTarget({ actions, openMenu });
  useMenuDismissal({ menu, menuRef, setMenu });
  useCanvasShortcuts({ actions, isMac });

  return (
    <>
      {children}
      <ContextMenuPortal
        menu={menu}
        menuRef={menuRef}
        actions={actions}
        modKeyLabel={modKeyLabel}
        deleteKeyLabel={deleteKeyLabel}
        onClose={closeMenu}
      />
    </>
  );
}
