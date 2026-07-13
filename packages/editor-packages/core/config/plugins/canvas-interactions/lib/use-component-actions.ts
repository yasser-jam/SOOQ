"use client";
import { useCallback, useMemo } from "react";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { readClipboard, writeClipboard } from "./clipboard";
import type { Location } from "./types";

/**
 * Hook 1/4 (D-7): every mutation the context menu / shortcuts can perform,
 * expressed as reducer dispatches keyed by component id. All actions land in
 * `store_config.json` — no editor-only state.
 */
export function useComponentActions() {
  const storeApi = useAppStoreApi();
  const dispatch = useAppStore((s) => s.dispatch);

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
      writeClipboard(loc.data);
    },
    [resolveLocation]
  );

  const doPaste = useCallback(
    (targetId: string | null) => {
      const clipboard = readClipboard();
      if (!clipboard) return;
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
        componentType: clipboard.type,
        destinationIndex,
        destinationZone: zone,
        // `insert` runs populateIds over nested slots, so children get fresh
        // stable ids even though we're reusing a snapshot.
        props: { ...clipboard.props },
        recordHistory: true,
      });
    },
    [dispatch, resolveLocation, storeApi]
  );

  return useMemo(
    () => ({
      resolveLocation,
      doSelect,
      doDuplicate,
      doRemove,
      doToggleHidden,
      doMove,
      doCopy,
      doPaste,
    }),
    [
      resolveLocation,
      doSelect,
      doDuplicate,
      doRemove,
      doToggleHidden,
      doMove,
      doCopy,
      doPaste,
    ]
  );
}

export type ComponentActions = ReturnType<typeof useComponentActions>;
