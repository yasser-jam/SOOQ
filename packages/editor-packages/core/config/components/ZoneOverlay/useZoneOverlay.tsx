"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SOOQ_ZONE_EVENT,
  ZONE_ACTION_ATTR,
  ZONE_TOGGLE_ATTR,
  type ZoneEventAction,
  type ZoneEventDetail,
} from "../../lib/zone-events";

export type UseZoneOverlayOptions = {
  zoneKey: string;
  isActive: boolean;
  editMode?: boolean;
  /** When true in the editor, force the overlay open for zone-plugin preview. */
  previewSelected?: boolean;
  startOpen?: boolean;
};

export const useZoneOverlay = ({
  zoneKey,
  isActive,
  editMode = false,
  previewSelected = false,
  startOpen = false,
}: UseZoneOverlayOptions) => {
  const [isOpen, setIsOpen] = useState(!!startOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);

  const apiRef = useRef({ open, close, toggle });
  apiRef.current = { open, close, toggle };

  useEffect(() => {
    if (!editMode) return;
    setIsOpen(previewSelected);
  }, [editMode, previewSelected]);

  useEffect(() => {
    if (editMode || !isActive || typeof window === "undefined") return;

    const onZoneEvent = (event: Event) => {
      const detail = (event as CustomEvent<ZoneEventDetail>).detail;
      if (!detail || detail.key !== zoneKey) return;

      const action: ZoneEventAction = detail.action ?? "toggle";
      if (action === "open") apiRef.current.open();
      else if (action === "close") apiRef.current.close();
      else apiRef.current.toggle();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const trigger = target.closest<HTMLElement>(`[${ZONE_TOGGLE_ATTR}]`);
      if (!trigger) return;
      if (trigger.getAttribute(ZONE_TOGGLE_ATTR) !== zoneKey) return;

      event.preventDefault();
      const action =
        (trigger.getAttribute(ZONE_ACTION_ATTR) as ZoneEventAction | null) ??
        "toggle";

      if (action === "open") apiRef.current.open();
      else if (action === "close") apiRef.current.close();
      else apiRef.current.toggle();
    };

    document.addEventListener(SOOQ_ZONE_EVENT, onZoneEvent as EventListener);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener(SOOQ_ZONE_EVENT, onZoneEvent as EventListener);
      document.removeEventListener("click", onClick);
    };
  }, [zoneKey, editMode, isActive]);

  return {
    isOpen: editMode ? previewSelected : isOpen,
    open,
    close,
    toggle,
    shouldRender: isActive || (editMode && previewSelected),
  };
};

export const useZonePortalTarget = () => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const doc = anchorRef.current?.ownerDocument ?? document;
    if (doc.body) setPortalTarget(doc.body);
  }, []);

  const Portal = ({ children }: { children: React.ReactNode }) => (
    <div ref={anchorRef} aria-hidden style={{ display: "contents" }}>
      {portalTarget ? createPortal(children, portalTarget) : null}
    </div>
  );

  return { anchorRef, portalTarget, Portal };
};
