"use client";
import { useEffect } from "react";
import { useAppStoreApi } from "@/core/store";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { getFrame } from "@/core/lib/get-frame";
import type { ComponentActions } from "./use-component-actions";

/**
 * Hook 4/4 (D-7): global keyboard shortcuts for the selected component —
 * duplicate / copy / paste / move / delete / hide. Skips form fields, open
 * dialogs, and anything inside `[data-puck-no-shortcuts]`.
 */
export function useCanvasShortcuts({
  actions,
  isMac,
}: {
  actions: ComponentActions;
  isMac: boolean;
}) {
  const storeApi = useAppStoreApi();
  const { doCopy, doDuplicate, doMove, doPaste, doRemove, doToggleHidden } =
    actions;

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
  }, [doCopy, doDuplicate, doMove, doPaste, doRemove, doToggleHidden, isMac, storeApi]);
}
