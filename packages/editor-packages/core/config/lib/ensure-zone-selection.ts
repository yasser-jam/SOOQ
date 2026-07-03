import { walkAppState } from "@/core/lib/data/walk-app-state";
import { getItem, type ItemSelector } from "@/core/lib/data/get-item";
import { getSelectorForId } from "@/core/lib/get-selector-for-id";
import { insertComponent } from "@/core/lib/insert-component";
import type { useAppStoreApi } from "@/core/store";
import type { PrivateAppState } from "@/core/types/Internal";

type AppStoreApi = ReturnType<typeof useAppStoreApi>;

const isZoneBlockResolvable = (
  state: PrivateAppState,
  rootZone: string,
  blockType: string
): boolean => {
  const block = state.data.zones?.[rootZone]?.find((item) => item.type === blockType);
  if (!block) return true;

  const id = block.props?.id;
  if (typeof id !== "string" || !id) return false;

  const selector = getSelectorForId(state, id);
  return !!selector && !!getItem(selector, state);
};

const reindexState = (appStoreApi: AppStoreApi) => {
  const { state, config } = appStoreApi.getState();
  const walked = walkAppState(state, config);

  appStoreApi.getState().dispatch({
    type: "set",
    state: walked,
    recordHistory: false,
  });
};

/**
 * Ensures a site zone block exists, indexes are in sync, and returns a
 * selector that resolves via `getItem` / `selectedItem`.
 */
export async function ensureZoneBlockSelector(
  rootZone: string,
  blockType: string,
  appStoreApi: AppStoreApi
): Promise<ItemSelector | null> {
  appStoreApi.getState().dispatch({
    type: "registerZone",
    zone: rootZone,
    recordHistory: false,
  });

  let state = appStoreApi.getState().state;

  if (!isZoneBlockResolvable(state, rootZone, blockType)) {
    reindexState(appStoreApi);
    state = appStoreApi.getState().state;
  }

  let block = state.data.zones?.[rootZone]?.find((item) => item.type === blockType);

  if (!block) {
    await insertComponent(blockType, rootZone, 0, appStoreApi);
    state = appStoreApi.getState().state;
    block = state.data.zones?.[rootZone]?.find((item) => item.type === blockType);
  }

  const blockId = block?.props?.id;
  if (typeof blockId !== "string" || !blockId) {
    return null;
  }

  let selector = getSelectorForId(state, blockId);

  if (!selector) {
    reindexState(appStoreApi);
    selector = getSelectorForId(appStoreApi.getState().state, blockId);
  }

  if (!selector) return null;

  const item = getItem(selector, appStoreApi.getState().state);
  if (!item) return null;

  return selector;
}
