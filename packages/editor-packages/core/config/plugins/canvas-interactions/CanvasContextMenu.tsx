"use client";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Eye,
  EyeOff,
  MousePointer2,
  Trash2,
} from "lucide-react";
import type { ComponentData } from "@/core/types";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { getClassNameFactory } from "@/core/lib";
import { getFrame } from "@/core/lib/get-frame";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("CanvasContextMenu", styles);

/**
 * Module-level clipboard. Holds the last-copied component snapshot so
 * Ctrl/Cmd+C -> Ctrl/Cmd+V works across re-renders and (within the same
 * session) across page-selector switches. Kept out of Zustand on purpose:
 * the clipboard is ephemeral and must NOT end up in `store_config.json`.
 */
let clipboardRef: ComponentData | null = null;

// ─── Types & helpers ────────────────────────────────────────────────────────

type MenuState = {
  x: number;
  y: number;
  targetId: string;
  targetLabel: string;
};

type Location = {
  zone: string;
  index: number;
  data: ComponentData;
  zoneLength: number;
};

// ─── Portal target resolution ───────────────────────────────────────────────

function getPortalRoot(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  let root = document.getElementById("canvas-context-menu-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "canvas-context-menu-root";
    document.body.appendChild(root);
  }
  return root;
}

// ─── The menu UI ────────────────────────────────────────────────────────────

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

function MenuItem({
  icon,
  label,
  shortcut,
  danger,
  disabled,
  onSelect,
}: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      // Use mousedown (not click) so we fire BEFORE any close-on-outside
      // handler that might unmount the button between mousedown and click.
      // Also preventDefault so the button doesn't steal focus from the
      // iframe's canvas (which would scroll it into view).
      onMouseDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
      onClick={(e) => {
        // mousedown handled everything; swallow click so nothing below reacts.
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`${getClassName("item")} ${
        danger ? getClassName("item--danger") : ""
      }`.trim()}
    >
      <span className={getClassName("itemIcon")} aria-hidden>
        {icon}
      </span>
      <span className={getClassName("itemLabel")}>{label}</span>
      {shortcut && <span className={getClassName("shortcut")}>{shortcut}</span>}
    </button>
  );
}

// ─── The root plugin component ──────────────────────────────────────────────

/**
 * Wraps the entire Puck UI. Responsibilities:
 *   1. Listen for `contextmenu` events inside and outside the preview iframe,
 *      find the nearest `data-puck-component`, and open a popup menu.
 *   2. Register global keyboard shortcuts for the selected component.
 *
 * Both responsibilities go through the same reducer actions (insert, duplicate,
 * remove, replace, move), so every mutation lands in `store_config.json` —
 * no editor-only state, nothing an AI agent couldn't reproduce programmatically.
 */
export function CanvasInteractions({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeApi = useAppStoreApi();
  const dispatch = useAppStore((s) => s.dispatch);
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad/.test(navigator.platform);
  const modKeyLabel = isMac ? "⌘" : "Ctrl";
  const deleteKeyLabel = isMac ? "⌫" : "Del";

  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // ── Location resolver ───────────────────────────────────────────────────

  const resolveLocation = useCallback(
    (id: string): Location | null => {
      const state = storeApi.getState().state;
      const node = state.indexes.nodes[id];
      if (!node) return null;
      // Puck stores the zone as just the slot name (e.g. "content") or
      // "default-zone" for root. The compound zone id used by reducer actions
      // AND `state.indexes.zones` is `${parentId}:${node.zone}` — the parent
      // of a root-level item is the literal string "root", and the parent of
      // a nested item is the owning component id. See
      // `packages/core/lib/get-selector-for-id.ts` for the canonical shape.
      const zone = `${node.parentId}:${node.zone}`;
      const zoneData = state.indexes.zones[zone];
      if (!zoneData) return null;
      const index = zoneData.contentIds.indexOf(id);
      if (index < 0) return null;
      return {
        zone,
        index,
        data: node.data,
        zoneLength: zoneData.contentIds.length,
      };
    },
    [storeApi]
  );

  // ── Action handlers ─────────────────────────────────────────────────────

  const doSelect = useCallback(
    (id: string) => {
      const loc = resolveLocation(id);
      if (!loc) return;
      dispatch({
        type: "setUi",
        ui: { itemSelector: { index: loc.index, zone: loc.zone } },
      });
    },
    [dispatch, resolveLocation]
  );

  const doDuplicate = useCallback(
    (id: string) => {
      const loc = resolveLocation(id);
      if (!loc) return;
      dispatch({
        type: "duplicate",
        sourceIndex: loc.index,
        sourceZone: loc.zone,
        recordHistory: true,
      });
    },
    [dispatch, resolveLocation]
  );

  const doRemove = useCallback(
    (id: string) => {
      const loc = resolveLocation(id);
      if (!loc) return;
      dispatch({
        type: "remove",
        index: loc.index,
        zone: loc.zone,
        recordHistory: true,
      });
    },
    [dispatch, resolveLocation]
  );

  const doToggleHidden = useCallback(
    (id: string) => {
      const loc = resolveLocation(id);
      if (!loc) return;
      const currentlyVisible =
        (loc.data.props as { visible?: boolean } | undefined)?.visible !==
        false;
      dispatch({
        type: "replace",
        destinationIndex: loc.index,
        destinationZone: loc.zone,
        data: {
          ...loc.data,
          props: {
            ...loc.data.props,
            visible: !currentlyVisible,
          },
        },
        recordHistory: true,
      });
    },
    [dispatch, resolveLocation]
  );

  const doMove = useCallback(
    (id: string, delta: -1 | 1) => {
      const loc = resolveLocation(id);
      if (!loc) return;
      const destIndex = loc.index + delta;
      if (destIndex < 0 || destIndex >= loc.zoneLength) return;
      dispatch({
        type: "move",
        sourceIndex: loc.index,
        sourceZone: loc.zone,
        destinationIndex: destIndex,
        destinationZone: loc.zone,
        recordHistory: true,
      });
    },
    [dispatch, resolveLocation]
  );

  const doCopy = useCallback(
    (id: string) => {
      const loc = resolveLocation(id);
      if (!loc) return;
      // Deep-clone so further edits to the source can't mutate the clipboard.
      // structuredClone is available in all evergreen browsers.
      clipboardRef =
        typeof structuredClone === "function"
          ? structuredClone(loc.data)
          : JSON.parse(JSON.stringify(loc.data));
    },
    [resolveLocation]
  );

  const doPaste = useCallback(
    (targetId: string | null) => {
      if (!clipboardRef) return;
      // Paste into the same zone as the target (right after it). If there is
      // no target (keyboard paste with no selection), drop at the end of root.
      let zone = rootDroppableId;
      let destinationIndex = 0;
      if (targetId) {
        const loc = resolveLocation(targetId);
        if (loc) {
          zone = loc.zone;
          destinationIndex = loc.index + 1;
        }
      } else {
        const content = storeApi.getState().state.data.content ?? [];
        destinationIndex = content.length;
      }
      dispatch({
        type: "insert",
        componentType: clipboardRef!.type,
        destinationIndex,
        destinationZone: zone,
        // `insert` runs populateIds over nested slots, so children get fresh
        // stable ids even though we're reusing a snapshot.
        props: { ...clipboardRef!.props },
        recordHistory: true,
      });
    },
    [dispatch, resolveLocation, storeApi]
  );

  // ── contextmenu listeners (outer doc + iframe doc) ──────────────────────

  const closeMenu = useCallback(() => setMenu(null), []);

  // Highlight the currently targeted block while the menu is open.
  // We do this with inline styles on the concrete element(s) instead of a
  // global CSS selector so CSS Modules stays pure and Next.js can compile.
  useEffect(() => {
    if (!menu) return;

    type Snapshot = {
      el: HTMLElement;
      outline: string;
      outlineOffset: string;
      boxShadow: string;
      transition: string;
    };

    const snapshots: Snapshot[] = [];
    const safeTargetId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(menu.targetId)
        : menu.targetId;

    const applyHighlight = (doc: Document | null) => {
      if (!doc) return;

      const el = doc.querySelector(
        `[data-puck-component="${safeTargetId}"]`
      ) as HTMLElement | null;

      if (!el) return;

      snapshots.push({
        el,
        outline: el.style.outline,
        outlineOffset: el.style.outlineOffset,
        boxShadow: el.style.boxShadow,
        transition: el.style.transition,
      });

      el.style.outline = "2px solid rgba(59, 130, 246, 0.55)";
      el.style.outlineOffset = "2px";
      el.style.boxShadow = "0 0 0 2px rgba(59, 130, 246, 0.14)";
      el.style.transition = el.style.transition
        ? `${el.style.transition}, outline-color 140ms ease, box-shadow 140ms ease`
        : "outline-color 140ms ease, box-shadow 140ms ease";
    };

    applyHighlight(document);
    const frameDoc = getFrame();
    if (frameDoc && frameDoc !== document) {
      applyHighlight(frameDoc);
    }

    return () => {
      snapshots.forEach(
        ({ el, outline, outlineOffset, boxShadow, transition }) => {
          el.style.outline = outline;
          el.style.outlineOffset = outlineOffset;
          el.style.boxShadow = boxShadow;
          el.style.transition = transition;
        }
      );
    };
  }, [menu]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleContextMenu = (e: MouseEvent, ownerDoc: Document) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const puckEl = target.closest?.(
        "[data-puck-component]"
      ) as HTMLElement | null;
      if (!puckEl) return;
      const id = puckEl.getAttribute("data-puck-component");
      if (!id) return;

      // preventDefault synchronously so the native browser menu never gets to
      // paint — do this BEFORE any store reads or React work.
      e.preventDefault();
      e.stopPropagation();

      // Translate iframe-local coords into outer-viewport coords. The iframe
      // itself is not scaled, but Puck wraps it in a `transform: scale(zoom)`
      // parent, so `getBoundingClientRect()` already reflects the on-screen
      // size. The ratio between that and the iframe's own CSS size gives us
      // the effective scale factor we need to apply to event coords.
      let x = e.clientX;
      let y = e.clientY;
      if (ownerDoc !== document) {
        const iframe = document.getElementById(
          "preview-frame"
        ) as HTMLIFrameElement | null;
        if (iframe) {
          const rect = iframe.getBoundingClientRect();
          const scaleX = iframe.clientWidth
            ? rect.width / iframe.clientWidth
            : 1;
          const scaleY = iframe.clientHeight
            ? rect.height / iframe.clientHeight
            : 1;
          x = rect.left + e.clientX * scaleX;
          y = rect.top + e.clientY * scaleY;
        }
      }

      const state = storeApi.getState();
      const node = state.state.indexes.nodes[id];
      const def = node
        ? (state.config.components as Record<string, { label?: string }>)[
            node.data.type
          ]
        : undefined;
      const customName = (node?.data.props as { name?: string } | undefined)
        ?.name;
      const label = customName?.trim() || def?.label || node?.data.type || id;

      // Pre-select the right-clicked component so the fields panel updates
      // immediately — this is exactly how Shopify behaves.
      doSelect(id);

      setMenu({ x, y, targetId: id, targetLabel: label });
    };

    const outerHandler = (e: MouseEvent) => handleContextMenu(e, document);
    document.addEventListener("contextmenu", outerHandler, true);

    // Attaching to the preview iframe's document is tricky because srcDoc
    // iframes swap out their contentDocument every time the iframe reloads.
    // Polling a one-shot grab (as the first iteration did) leaves us stranded
    // on the old document. Instead we:
    //   1. Find the iframe element itself (stable across reloads).
    //   2. Re-attach on every `load` event.
    //   3. Also attach immediately in case the iframe is already loaded.
    // An interval also watches for the iframe being remounted (rare, but the
    // shopify plugin header can trigger a Puck-internal remount).
    let disposed = false;
    let attachedDoc: Document | null = null;
    let attachedIframe: HTMLIFrameElement | null = null;
    const iframeHandler = (e: MouseEvent) => {
      if (attachedDoc) handleContextMenu(e, attachedDoc);
    };

    const detachIframeDoc = () => {
      if (attachedDoc) {
        attachedDoc.removeEventListener("contextmenu", iframeHandler, true);
        attachedDoc = null;
      }
    };

    const attachIframeDoc = () => {
      if (disposed || !attachedIframe) return;
      const doc = attachedIframe.contentDocument;
      if (!doc || doc === attachedDoc) return;
      detachIframeDoc();
      attachedDoc = doc;
      doc.addEventListener("contextmenu", iframeHandler, true);
    };

    const onIframeLoad = () => attachIframeDoc();

    const tryBindIframe = () => {
      if (disposed) return;
      const el = document.getElementById(
        "preview-frame"
      ) as HTMLIFrameElement | null;
      if (!el || el === attachedIframe) return;
      if (attachedIframe) {
        attachedIframe.removeEventListener("load", onIframeLoad);
        detachIframeDoc();
      }
      attachedIframe = el;
      el.addEventListener("load", onIframeLoad);
      // If the iframe has already loaded by the time we got here (common —
      // plugin mounts after `READY`), contentDocument is already valid.
      attachIframeDoc();
    };
    tryBindIframe();
    // Watch for the iframe element being remounted (rare — e.g. a Puck-internal
    // remount). A MutationObserver only fires on actual host-DOM changes,
    // unlike the previous 500 ms polling interval that kept the main thread
    // busy for the editor's whole lifetime.
    const remountObserver = new MutationObserver(() => tryBindIframe());
    remountObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      remountObserver.disconnect();
      document.removeEventListener("contextmenu", outerHandler, true);
      if (attachedIframe) {
        attachedIframe.removeEventListener("load", onIframeLoad);
      }
      detachIframeDoc();
    };
  }, [doSelect, storeApi]);

  // ── Close on outside click / scroll / Escape ────────────────────────────

  useEffect(() => {
    if (!menu) return;

    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) {
        return;
      }
      closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    };
    const onScroll = () => closeMenu();

    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("scroll", onScroll, true);
    // Also listen inside the iframe so scrolling the canvas dismisses the menu.
    const frameDoc = getFrame();
    if (frameDoc && frameDoc !== document) {
      frameDoc.addEventListener("mousedown", onPointerDown, true);
      frameDoc.addEventListener("scroll", onScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("scroll", onScroll, true);
      if (frameDoc && frameDoc !== document) {
        frameDoc.removeEventListener("mousedown", onPointerDown, true);
        frameDoc.removeEventListener("scroll", onScroll, true);
      }
    };
  }, [menu, closeMenu]);

  // ── Keep menu inside viewport ───────────────────────────────────────────

  useLayoutEffect(() => {
    if (!menu || !menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    const overflowX = rect.right - (window.innerWidth - padding);
    const overflowY = rect.bottom - (window.innerHeight - padding);
    if (overflowX > 0 || overflowY > 0) {
      setMenu((prev) =>
        prev
          ? {
              ...prev,
              x: Math.max(padding, prev.x - Math.max(0, overflowX)),
              y: Math.max(padding, prev.y - Math.max(0, overflowY)),
            }
          : prev
      );
    }
    // We only want this to run once per menu open — otherwise the setState
    // would loop. The menu coords are stable after the correction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu?.targetId]);

  // ── Global keyboard shortcuts ───────────────────────────────────────────

  useEffect(() => {
    if (typeof document === "undefined") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      const hasModalOpen =
        document.querySelector(
          "[role='dialog'][aria-modal='true'], [data-puck-no-shortcuts='true']"
        ) !== null;

      if (hasModalOpen) return;

      // Don't fight form fields. Text inputs, textareas, selects, and
      // contentEditable elements all keep their native behaviour.
      const t = e.target as HTMLElement | null;
      if (t) {
        if (t.closest("[data-puck-no-shortcuts='true']")) {
          return;
        }

        const tag = t.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          t.isContentEditable
        ) {
          return;
        }
      }

      const mod = isMac ? e.metaKey : e.ctrlKey;
      const state = storeApi.getState();
      const sel = state.state.ui.itemSelector;

      // No selection → still allow paste at the end of root.
      if (!sel && mod && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        doPaste(null);
        return;
      }
      if (!sel) return;

      // Resolve the selected id from selector.
      const zoneData = state.state.indexes.zones[sel.zone ?? rootDroppableId];
      const id = zoneData?.contentIds[sel.index ?? -1];
      if (!id) return;

      if (mod && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        doDuplicate(id);
      } else if (mod && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        doCopy(id);
      } else if (mod && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        doPaste(id);
      } else if (mod && e.key === "ArrowUp") {
        e.preventDefault();
        doMove(id, -1);
      } else if (mod && e.key === "ArrowDown") {
        e.preventDefault();
        doMove(id, 1);
      } else if (!mod && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        doRemove(id);
      } else if (!mod && (e.key === "h" || e.key === "H")) {
        e.preventDefault();
        doToggleHidden(id);
      }
    };

    // Capture phase so we catch events whether they happen in the outer doc
    // or bubble up from inside the iframe (Puck re-dispatches them).
    document.addEventListener("keydown", onKey, true);
    const frameDoc = getFrame();
    if (frameDoc && frameDoc !== document) {
      frameDoc.addEventListener("keydown", onKey, true);
    }

    return () => {
      document.removeEventListener("keydown", onKey, true);
      if (frameDoc && frameDoc !== document) {
        frameDoc.removeEventListener("keydown", onKey, true);
      }
    };
  }, [
    doCopy,
    doDuplicate,
    doMove,
    doPaste,
    doRemove,
    doToggleHidden,
    isMac,
    storeApi,
  ]);

  // ── Menu rendering ──────────────────────────────────────────────────────

  const menuContent = useMemo(() => {
    if (!menu) return null;
    const loc = resolveLocation(menu.targetId);
    const visible =
      (loc?.data.props as { visible?: boolean } | undefined)?.visible !== false;
    const canMoveUp = !!loc && loc.index > 0;
    const canMoveDown = !!loc && loc.index < loc.zoneLength - 1;
    const hasClipboard = !!clipboardRef;

    return (
      <div
        ref={menuRef}
        className={getClassName()}
        style={{ left: menu.x, top: menu.y }}
        role="menu"
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className={getClassName("header")}>
          <span className={getClassName("headerName")}>{menu.targetLabel}</span>
        </div>

        <div className={getClassName("group")}>
          <MenuItem
            icon={<MousePointer2 size={14} />}
            label="Select"
            onSelect={() => {
              doSelect(menu.targetId);
              closeMenu();
            }}
          />
        </div>

        <div className={getClassName("group")}>
          <MenuItem
            icon={<Copy size={14} />}
            label="Copy"
            shortcut={`${modKeyLabel} C`}
            onSelect={() => {
              doCopy(menu.targetId);
              closeMenu();
            }}
          />
          <MenuItem
            icon={<ClipboardPaste size={14} />}
            label="Paste below"
            shortcut={`${modKeyLabel} V`}
            disabled={!hasClipboard}
            onSelect={() => {
              doPaste(menu.targetId);
              closeMenu();
            }}
          />
          <MenuItem
            icon={<CopyPlus size={14} />}
            label="Duplicate"
            shortcut={`${modKeyLabel} D`}
            onSelect={() => {
              doDuplicate(menu.targetId);
              closeMenu();
            }}
          />
        </div>

        <div className={getClassName("group")}>
          <MenuItem
            icon={<ArrowUp size={14} />}
            label="Move up"
            shortcut={`${modKeyLabel} ↑`}
            disabled={!canMoveUp}
            onSelect={() => {
              doMove(menu.targetId, -1);
              closeMenu();
            }}
          />
          <MenuItem
            icon={<ArrowDown size={14} />}
            label="Move down"
            shortcut={`${modKeyLabel} ↓`}
            disabled={!canMoveDown}
            onSelect={() => {
              doMove(menu.targetId, 1);
              closeMenu();
            }}
          />
        </div>

        <div className={getClassName("group")}>
          <MenuItem
            icon={visible ? <EyeOff size={14} /> : <Eye size={14} />}
            label={visible ? "Hide" : "Show"}
            shortcut="H"
            onSelect={() => {
              doToggleHidden(menu.targetId);
              closeMenu();
            }}
          />
          <MenuItem
            icon={<Trash2 size={14} />}
            label="Delete"
            shortcut={deleteKeyLabel}
            danger
            onSelect={() => {
              doRemove(menu.targetId);
              closeMenu();
            }}
          />
        </div>
      </div>
    );
  }, [
    menu,
    resolveLocation,
    modKeyLabel,
    deleteKeyLabel,
    closeMenu,
    doSelect,
    doCopy,
    doPaste,
    doDuplicate,
    doMove,
    doToggleHidden,
    doRemove,
  ]);

  const portalRoot = typeof document !== "undefined" ? getPortalRoot() : null;

  return (
    <>
      {children}
      {menuContent && portalRoot ? createPortal(menuContent, portalRoot) : null}
    </>
  );
}
