import { populateIds } from "@/core/lib/data/populate-ids";
import { walkAppState } from "@/core/lib/data/walk-app-state";
import { getSelectorForId } from "@/core/lib/get-selector-for-id";
import type { useAppStoreApi } from "@/core/store";
import type { Content, Data } from "@/core/types";
import type { PrivateAppState } from "@/core/types/Internal";
import { zoneCache } from "../../reducer/actions/register-zone";
import type { ZonePreset } from "../presets/types";
import { ROOT_ZONE_FOOTER, ROOT_ZONE_HEADER } from "../shell-zones";

type AppStoreApi = ReturnType<typeof useAppStoreApi>;

const LEGACY_ZONE_KEYS: Record<string, readonly string[]> = {
  [ROOT_ZONE_HEADER]: ["root:zone:header", "zone:header"],
  [ROOT_ZONE_FOOTER]: ["root:zone:footer", "zone:footer"],
};

function stripLegacyZoneKeys(
  zones: Record<string, Content>,
  rootZone: string
): Record<string, Content> {
  const legacyKeys = LEGACY_ZONE_KEYS[rootZone];
  if (!legacyKeys?.length) return zones;

  const next = { ...zones };
  legacyKeys.forEach((key) => {
    delete next[key];
  });

  return next;
}

function collectRemovedNodeIds(
  state: PrivateAppState,
  rootZone: string
): string[] {
  const items = state.data.zones?.[rootZone] ?? [];
  const rootIds = items
    .map((item) => item.props?.id)
    .filter((id): id is string => typeof id === "string");

  const toDelete = new Set<string>(rootIds);

  Object.entries(state.indexes.nodes).forEach(([nodeId, nodeData]) => {
    const pathRootIds = nodeData.path.map((p) => p.split(":")[0]);
    if (pathRootIds.some((id) => toDelete.has(id))) {
      toDelete.add(nodeId);
    }
  });

  return [...toDelete];
}

function pruneStaleZones<UserData extends Data>(
  state: PrivateAppState<UserData>
): PrivateAppState<UserData> {
  const allowed = new Set(Object.keys(state.indexes.zones));

  return {
    ...state,
    data: {
      ...state.data,
      zones: Object.fromEntries(
        Object.entries(state.data.zones ?? {}).filter(([key]) =>
          allowed.has(key)
        )
      ),
    },
  };
}

/** Replace all content in a site zone with a preset (Section for header/footer). */
export function applyZonePreset(
  rootZone: string,
  preset: ZonePreset,
  appStoreApi: AppStoreApi
) {
  const { config, dispatch } = appStoreApi.getState();

  delete zoneCache[rootZone];

  dispatch({ type: "registerZone", zone: rootZone, recordHistory: false });

  const state = appStoreApi.getState().state;
  const removedIds = collectRemovedNodeIds(state, rootZone);
  const node = populateIds(preset.componentData, config, true);

  const nextZones = stripLegacyZoneKeys(
    { ...(state.data.zones ?? {}), [rootZone]: [node] },
    rootZone
  );

  Object.keys(nextZones).forEach((zoneCompound) => {
    const parentId = zoneCompound.split(":")[0];
    if (removedIds.includes(parentId)) {
      delete nextZones[zoneCompound];
    }
  });

  let walked = walkAppState(
    { ...state, data: { ...state.data, zones: nextZones } },
    config
  );

  walked = pruneStaleZones(walked);

  dispatch({
    type: "set",
    state: walked,
    recordHistory: true,
  });

  const selector = getSelectorForId(walked, node.props.id as string);
  if (!selector) return null;

  dispatch({
    type: "setUi",
    ui: {
      itemSelector: selector,
      zonePreviewRoot: rootZone,
      rightSideBarVisible: true,
      plugin: { current: "zones" },
    },
  });

  return selector;
}

/** Apply a header layout preset into `root:zone-header`. */
export function applyHeaderZonePreset(
  preset: ZonePreset,
  appStoreApi: AppStoreApi
) {
  return applyZonePreset(ROOT_ZONE_HEADER, preset, appStoreApi);
}

/** Insert multiple presets into a zone at once, selecting the first one. */
export function applyZonePresets(
  rootZone: string,
  presets: ZonePreset[],
  appStoreApi: AppStoreApi
) {
  if (presets.length === 0) return null;
  if (presets.length === 1) return applyZonePreset(rootZone, presets[0], appStoreApi);

  const { config, dispatch } = appStoreApi.getState();

  delete zoneCache[rootZone];

  dispatch({ type: "registerZone", zone: rootZone, recordHistory: false });

  const state = appStoreApi.getState().state;
  const removedIds = collectRemovedNodeIds(state, rootZone);
  const nodes = presets.map((p) => populateIds(p.componentData, config, true));

  const nextZones = stripLegacyZoneKeys(
    { ...(state.data.zones ?? {}), [rootZone]: nodes },
    rootZone
  );

  Object.keys(nextZones).forEach((zoneCompound) => {
    const parentId = zoneCompound.split(":")[0];
    if (removedIds.includes(parentId)) {
      delete nextZones[zoneCompound];
    }
  });

  let walked = walkAppState(
    { ...state, data: { ...state.data, zones: nextZones } },
    config
  );

  walked = pruneStaleZones(walked);

  dispatch({
    type: "set",
    state: walked,
    recordHistory: true,
  });

  const selector = getSelectorForId(walked, nodes[0].props.id as string);
  if (!selector) return null;

  dispatch({
    type: "setUi",
    ui: {
      itemSelector: selector,
      zonePreviewRoot: rootZone,
      rightSideBarVisible: true,
      plugin: { current: "zones" },
    },
  });

  return selector;
}
