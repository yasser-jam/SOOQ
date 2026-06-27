import type { AppStore } from "../store";
import { rootDroppableId } from "./root-droppable-id";
import type { SectionPreset } from "../config/presets";

/**
 * Insert a section preset into the page root content array via the Puck reducer.
 * Uses the atomic `insert` action so nested slot trees receive fresh ids from
 * `populateIds` — same persistence path as drag-and-drop.
 */
export function insertPresetSection(
  preset: SectionPreset,
  appStore: AppStore,
  insertIndex?: number
): number {
  const { getState } = appStore;
  const dispatch = getState().dispatch;
  const currentLength = getState().state.data.content?.length ?? 0;
  const idx =
    typeof insertIndex === "number"
      ? Math.min(Math.max(insertIndex, 0), currentLength)
      : currentLength;

  dispatch({
    type: "insert",
    componentType: preset.componentData.type,
    destinationZone: rootDroppableId,
    destinationIndex: idx,
    props: preset.componentData.props as Record<string, unknown>,
    recordHistory: true,
  });

  dispatch({
    type: "setUi",
    ui: { itemSelector: { index: idx, zone: rootDroppableId } },
  });

  return idx;
}
