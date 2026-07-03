"use client";

import { useAppStore } from "@/core/store";
import { getItem } from "@/core/lib/data/get-item";

/** True when this zone block is the current canvas selection (zones plugin preview). */
export function useZonePreviewSelected(componentId?: string) {
  return useAppStore((s) => {
    if (!componentId) return false;

    const selector = s.state.ui.itemSelector;
    if (!selector) return false;

    const item = getItem(selector, s.state);
    if (!item?.props?.id) return false;

    return item.props.id === componentId;
  });
}
