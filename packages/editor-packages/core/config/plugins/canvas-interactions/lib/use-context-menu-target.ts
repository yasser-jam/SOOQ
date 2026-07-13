"use client";
import { useEffect } from "react";
import { useAppStoreApi } from "@/core/store";
import type { MenuState } from "./types";
import type { ComponentActions } from "./use-component-actions";

/**
 * Hook 2/4 (D-7): listens for `contextmenu` on the outer document AND the
 * preview iframe's document (re-binding across srcDoc reloads/remounts),
 * resolves the nearest `data-puck-component`, pre-selects it, and opens the
 * menu at outer-viewport coordinates.
 */
export function useContextMenuTarget({
  actions,
  openMenu,
}: {
  actions: ComponentActions;
  openMenu: (menu: MenuState) => void;
}) {
  const storeApi = useAppStoreApi();
  const { doSelect } = actions;

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

      openMenu({ x, y, targetId: id, targetLabel: label });
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
    // A MutationObserver watches for the iframe being remounted (rare, but the
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
  }, [doSelect, openMenu, storeApi]);
}
