"use client";

import { useCallback } from "react";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { getSelectorForId } from "@/core/lib/get-selector-for-id";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import type { DefaultComponentProps } from "@/core/types";
import {
  normalizeLayout,
  type LayoutFieldProps,
} from "../components/Layout/layout-shared";

/**
 * Read the currently selected block's props. Returns null when nothing is
 * selected or the selection is the root.
 */
export function useBlockProps<
  Props extends DefaultComponentProps = DefaultComponentProps
>(): Props | null {
  return useAppStore(
    (s) => (s.selectedItem?.props as Props | undefined) ?? null
  );
}

/**
 * Read a single prop from the selected block.
 */
export function useBlockProp<T>(
  key: string,
  fallback?: T
): T | undefined {
  return useAppStore((s) => {
    const value = (s.selectedItem?.props as Record<string, unknown> | undefined)?.[
      key
    ];
    return (value ?? fallback) as T | undefined;
  });
}

/**
 * Patch one or more props on the selected block through Puck's
 * resolve-and-replace pipeline (same path as AutoField onChange).
 */
export function useBlockPatch() {
  const appStore = useAppStoreApi();

  return useCallback(
    async (patch: Record<string, unknown>) => {
      const { dispatch, selectedItem, resolveComponentData } =
        appStore.getState();
      if (!selectedItem) return;

      const newProps = { ...selectedItem.props, ...patch };

      const resolved = await resolveComponentData(
        { ...selectedItem, props: newProps },
        "replace"
      );

      const selector = getSelectorForId(
        appStore.getState().state,
        selectedItem.props.id
      );
      if (!selector) return;

      dispatch({
        type: "replace",
        destinationIndex: selector.index,
        destinationZone: selector.zone || rootDroppableId,
        data: resolved.node,
      });
    },
    [appStore]
  );
}

/**
 * Read the normalized `layout` prop for the selected block.
 */
export function useLayout(): Required<LayoutFieldProps> {
  const layout = useBlockProp<LayoutFieldProps>("layout");
  return normalizeLayout(layout);
}

/**
 * Patch the `layout` prop for the selected block. Used by the border
 * designer and other layout-aware custom fields.
 */
export function useLayoutPatch() {
  const patchBlock = useBlockPatch();

  return useCallback(
    async (patch: Partial<LayoutFieldProps>) => {
      const appStore = useAppStoreApi();
      const selectedItem = appStore.getState().selectedItem;
      if (!selectedItem) return;

      const currentLayout =
        ((selectedItem.props as { layout?: LayoutFieldProps }).layout ??
          {}) as LayoutFieldProps;

      await patchBlock({
        layout: { ...currentLayout, ...patch },
      });
    },
    [patchBlock]
  );
}
