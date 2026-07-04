import type { AppStore } from "../store";
import { rootDroppableId } from "./root-droppable-id";
import type { SectionPreset } from "../config/presets";
import { getItem } from "./data/get-item";
import { resolveAndReplaceData } from "./data/resolve-and-replace-data";

const SHELL_REPLACE_TYPES = new Set(["SiteHeader", "SiteFooter"]);

function findShellIndex(
  content: Array<{ type?: string }> | undefined,
  type: string
): number {
  if (!Array.isArray(content)) return -1;
  return content.findIndex((item) => item?.type === type);
}

/**
 * Insert a preset into the page via the Puck reducer.
 * Section presets append to root content; shell presets replace the existing
 * SiteHeader / SiteFooter when present (same persistence path as drag-and-drop).
 */
async function resolveInsertedSection(
  appStore: AppStore,
  itemSelector: { index: number; zone: string }
): Promise<void> {
  const itemData = getItem(itemSelector, appStore.getState().state);
  if (!itemData) return;
  await resolveAndReplaceData(itemData, appStore.getState, "insert");
}

export async function insertPresetSection(
  preset: SectionPreset,
  appStore: AppStore,
  insertIndex?: number
): Promise<number> {
  const { getState } = appStore;
  const dispatch = getState().dispatch;
  const content = getState().state.data.content ?? [];
  const componentType = preset.componentData.type;

  if (componentType && SHELL_REPLACE_TYPES.has(componentType)) {
    const existingIndex = findShellIndex(content, componentType);
    const presetProps = preset.componentData.props as Record<string, unknown>;

    if (existingIndex >= 0) {
      const existing = content[existingIndex] as {
        props?: Record<string, unknown>;
      };
      const existingId = existing?.props?.id;

      dispatch({
        type: "replace",
        destinationZone: rootDroppableId,
        destinationIndex: existingIndex,
        data: {
          type: componentType,
          props: {
            ...presetProps,
            ...(typeof existingId === "string" ? { id: existingId } : {}),
          },
        },
      });

      dispatch({
        type: "setUi",
        ui: {
          itemSelector: { index: existingIndex, zone: rootDroppableId },
        },
      });

      await resolveInsertedSection(appStore, {
        index: existingIndex,
        zone: rootDroppableId,
      });

      return existingIndex;
    }

    const idx =
      componentType === "SiteHeader"
        ? 0
        : typeof insertIndex === "number"
          ? Math.min(Math.max(insertIndex, 0), content.length)
          : content.length;

    dispatch({
      type: "insert",
      componentType,
      destinationZone: rootDroppableId,
      destinationIndex: idx,
      props: presetProps,
      recordHistory: true,
    });

    dispatch({
      type: "setUi",
      ui: { itemSelector: { index: idx, zone: rootDroppableId } },
    });

    await resolveInsertedSection(appStore, { index: idx, zone: rootDroppableId });

    return idx;
  }

  const currentLength = content.length;
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

  await resolveInsertedSection(appStore, { index: idx, zone: rootDroppableId });

  return idx;
}
