import { RegisterZoneAction, UnregisterZoneAction } from "..";
import { setupZone } from "../../lib/data/setup-zone";
import { walkAppState } from "../../lib/data/walk-app-state";
import { getSelectorForId } from "../../lib/get-selector-for-id";
import { Content, Data } from "../../types";
import { PrivateAppState } from "../../types/Internal";
import { AppStore } from "../../store";

// Restore unregistered zones when re-registering in same session
export const zoneCache: Record<string, Content> = {};

export const addToZoneCache = (key: string, data: Content) => {
  zoneCache[key] = data;
};

export function registerZoneAction<UserData extends Data>(
  state: PrivateAppState<UserData>,
  action: RegisterZoneAction,
  appStore?: AppStore
): PrivateAppState<UserData> {
  if (zoneCache[action.zone]) {
    const nextState = {
      ...state,
      data: {
        ...state.data,
        zones: {
          ...state.data.zones,
          [action.zone]: zoneCache[action.zone],
        },
      },
    };

    if (appStore) {
      return walkAppState(nextState, appStore.config);
    }

    return {
      ...nextState,
      indexes: {
        ...state.indexes,
        zones: {
          ...state.indexes.zones,
          [action.zone]: {
            ...state.indexes.zones[action.zone],
            contentIds: zoneCache[action.zone].map((item) => item.props.id),
            type: "dropzone",
          },
        },
      },
    };
  }

  const existingZoneContent = state.data.zones?.[action.zone];
  const zoneAlreadyIndexed =
    Array.isArray(existingZoneContent) &&
    existingZoneContent.length > 0 &&
    appStore &&
    existingZoneContent.every((item) => {
      const id = item.props?.id;
      return typeof id === "string" && !!getSelectorForId(state, id);
    });

  if (zoneAlreadyIndexed) {
    return state;
  }

  const data = setupZone(state.data, action.zone);
  const nextState = { ...state, data };
  const zoneContent = data.zones?.[action.zone] ?? [];

  const isOutOfSync =
    zoneContent.length > 0 &&
    appStore &&
    zoneContent.some((item) => {
      const id = item.props?.id;
      return typeof id === "string" && !getSelectorForId(state, id);
    });

  if (isOutOfSync && appStore) {
    return walkAppState(nextState, appStore.config);
  }

  return nextState;
}

export function unregisterZoneAction<UserData extends Data>(
  state: PrivateAppState<UserData>,
  action: UnregisterZoneAction
): PrivateAppState<UserData> {
  const _zones = { ...(state.data.zones || {}) };
  const zoneIndex = { ...(state.indexes.zones || {}) };

  if (_zones[action.zone]) {
    zoneCache[action.zone] = _zones[action.zone];

    delete _zones[action.zone];
  }

  delete zoneIndex[action.zone];

  return {
    ...state,
    data: {
      ...state.data,
      zones: _zones,
    },
    indexes: {
      ...state.indexes,
      zones: zoneIndex,
    },
  };
}
