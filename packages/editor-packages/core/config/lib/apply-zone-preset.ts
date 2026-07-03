import { populateIds } from "@/core/lib/data/populate-ids";
import { walkAppState } from "@/core/lib/data/walk-app-state";
import { getSelectorForId } from "@/core/lib/get-selector-for-id";
import type { useAppStoreApi } from "@/core/store";
import type { ZonePreset } from "../presets/types";

type AppStoreApi = ReturnType<typeof useAppStoreApi>;

/** Replace all content in a site zone with a preset (Section for header/footer). */
export function applyZonePreset(
  rootZone: string,
  preset: ZonePreset,
  appStoreApi: AppStoreApi
) {
  const { config, state, dispatch } = appStoreApi.getState();

  dispatch({ type: "registerZone", zone: rootZone, recordHistory: false });

  const node = populateIds(preset.componentData, config);
  const zones = {
    ...(state.data.zones ?? {}),
    [rootZone]: [node],
  };

  const walked = walkAppState(
    { ...state, data: { ...state.data, zones } },
    config
  );

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
      rightSideBarVisible: true,
    },
  });

  return selector;
}

/** Insert multiple presets into a zone at once, selecting the first one. */
export function applyZonePresets(
  rootZone: string,
  presets: ZonePreset[],
  appStoreApi: AppStoreApi
) {
  if (presets.length === 0) return null;
  if (presets.length === 1) return applyZonePreset(rootZone, presets[0], appStoreApi);

  const { config, state, dispatch } = appStoreApi.getState();

  dispatch({ type: "registerZone", zone: rootZone, recordHistory: false });

  const nodes = presets.map((p) => populateIds(p.componentData, config));
  const zones = {
    ...(state.data.zones ?? {}),
    [rootZone]: nodes,
  };

  const walked = walkAppState(
    { ...state, data: { ...state.data, zones } },
    config
  );

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
      rightSideBarVisible: true,
    },
  });

  return selector;
}
