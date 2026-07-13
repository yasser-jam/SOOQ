"use client";
import { useEffect, useLayoutEffect, type RefObject } from "react";
import { getFrame } from "@/core/lib/get-frame";
import type { MenuState } from "./types";

/**
 * Hook 3/4 (D-7): everything about an OPEN menu's lifecycle — highlight the
 * targeted block, close on outside click / scroll / Escape, and clamp the
 * popup back inside the viewport.
 */
export function useMenuDismissal({
  menu,
  menuRef,
  setMenu,
}: {
  menu: MenuState | null;
  menuRef: RefObject<HTMLDivElement | null>;
  setMenu: React.Dispatch<React.SetStateAction<MenuState | null>>;
}) {
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

  // Close on outside click / scroll / Escape.
  useEffect(() => {
    if (!menu) return;

    const closeMenu = () => setMenu(null);

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
  }, [menu, menuRef, setMenu]);

  // Keep menu inside viewport.
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
}
