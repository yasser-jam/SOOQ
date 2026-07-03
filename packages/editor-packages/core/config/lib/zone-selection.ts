import { getItem, type ItemSelector } from "@/core/lib/data/get-item";
import type { PrivateAppState } from "@/core/types/Internal";
import {
  ROOT_SITE_ZONE_KEYS,
} from "../shell-zones";
import {
  ZONE_DEFINITIONS,
  getZoneDefinitionByRootZone,
  type ZoneDefinition,
} from "./zone-registry";

export function getSelectedItemId(
  state: PrivateAppState,
  selector: ItemSelector | null
): string | null {
  if (!selector) return null;

  const item = getItem(selector, state);
  const id = item?.props?.id;

  return typeof id === "string" ? id : null;
}

/** True when `nodeId` is `ancestorId` or nested under it in the Puck tree. */
export function isNodeOrDescendantOf(
  state: PrivateAppState,
  nodeId: string,
  ancestorId: string
): boolean {
  let id: string | null = nodeId;

  while (id) {
    if (id === ancestorId) return true;

    const node = state.indexes.nodes[id];
    if (!node?.parentId) break;

    id = node.parentId;
  }

  return false;
}

function findOverlayZoneBlockId(
  state: PrivateAppState,
  startId: string
): string | null {
  let id: string | null = startId;

  while (id) {
    const node = state.indexes.nodes[id];
    if (!node) break;

    const type = node.data?.type;
    const overlayZone = ZONE_DEFINITIONS.find(
      (zone) => !zone.isPresetZone && zone.blockType === type
    );

    if (overlayZone) return id;

    id = node.parentId;
  }

  return null;
}

function findPresetSectionRootZone(
  state: PrivateAppState,
  startId: string
): string | null {
  let id: string | null = startId;

  while (id) {
    const node = state.indexes.nodes[id];
    if (!node) break;

    if (node.data?.type === "Section") {
      for (const rootZone of ROOT_SITE_ZONE_KEYS) {
        const definition = getZoneDefinitionByRootZone(rootZone);
        if (!definition?.isPresetZone) continue;

        const contentIds = state.indexes.zones[rootZone]?.contentIds ?? [];
        if (contentIds.includes(id)) return rootZone;
      }
    }

    id = node.parentId;
  }

  return null;
}

/** Resolve the site zone for the current canvas selection (zone block or nested content). */
export function resolveZoneDefinitionFromState(
  state: PrivateAppState,
  selector: ItemSelector | null,
  selectedItem?: { type: string; props?: { id?: string } } | null
): ZoneDefinition | undefined {
  if (!selector) return undefined;

  const item = selectedItem ?? getItem(selector, state);

  if (!item) {
    return selector.zone ? getZoneDefinitionByRootZone(selector.zone) : undefined;
  }

  const direct = ZONE_DEFINITIONS.find(
    (zone) => zone.blockType === item.type
  );
  if (direct) return direct;
  if (item.type === "Section" && selector.zone) {
    const presetZone = getZoneDefinitionByRootZone(selector.zone);
    if (presetZone?.isPresetZone) return presetZone;
  }

  const startId = item.props?.id;
  if (typeof startId !== "string") return undefined;

  const overlayBlockId = findOverlayZoneBlockId(state, startId);
  if (overlayBlockId) {
    const type = state.indexes.nodes[overlayBlockId]?.data?.type;
    return ZONE_DEFINITIONS.find((zone) => zone.blockType === type);
  }

  const rootZone = findPresetSectionRootZone(state, startId);
  if (rootZone) return getZoneDefinitionByRootZone(rootZone);

  return undefined;
}

export function isZonePreviewActive(
  state: PrivateAppState,
  selector: ItemSelector | null,
  zoneBlockId: string | undefined
): boolean {
  if (!zoneBlockId) return false;

  const selectedId = getSelectedItemId(state, selector);
  if (!selectedId) return false;

  return isNodeOrDescendantOf(state, selectedId, zoneBlockId);
}
