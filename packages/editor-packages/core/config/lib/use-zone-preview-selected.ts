"use client";

import { useAppStore } from "@/core/store";
import { isZonePreviewActive } from "./zone-selection";

/** True when this zone block (or any nested block inside it) is selected. */
export function useZonePreviewSelected(componentId?: string) {
  return useAppStore((s) =>
    isZonePreviewActive(s.state, s.state.ui.itemSelector, componentId)
  );
}
