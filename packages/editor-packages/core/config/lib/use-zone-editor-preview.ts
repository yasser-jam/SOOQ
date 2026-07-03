"use client";

import { getItem } from "@/core/lib/data/get-item";
import { useAppStore } from "@/core/store";
import { getZoneDefinitionByRootZone } from "./zone-registry";
import { resolveZoneDefinitionFromState } from "./zone-selection";

/** True when this overlay zone is being edited (from المناطق panel or nested selection). */
export function useZoneEditorPreview(
  overlayBlockType: "ZonePopup" | "ZoneDrawer" | "ZoneBottomSheet"
) {
  return useAppStore((s) => {
    const previewRoot = s.state.ui.zonePreviewRoot;
    if (previewRoot) {
      const definition = getZoneDefinitionByRootZone(previewRoot);
      if (definition?.blockType === overlayBlockType) return true;
    }

    const selector = s.state.ui.itemSelector;
    if (!selector) return false;

    const selectedItem = getItem(selector, s.state);
    const definition = resolveZoneDefinitionFromState(
      s.state,
      selector,
      selectedItem ?? undefined
    );

    return definition?.blockType === overlayBlockType;
  });
}
