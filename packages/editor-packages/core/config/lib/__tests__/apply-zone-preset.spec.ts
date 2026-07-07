import { createAppStore, defaultAppState } from "@/core/store";
import { walkAppState } from "@/core/lib/data/walk-app-state";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import config from "../../index";
import { ROOT_ZONE_HEADER } from "../../shell-zones";
import {
  applyHeaderZonePreset,
  applyZonePreset,
} from "../apply-zone-preset";
import { ZONE_HEADER_PRESETS } from "../../presets";

describe("apply-zone-preset", () => {
  const appStore = createAppStore({
    config,
    state: walkAppState(defaultAppState, config),
  });

  it("places header preset Section in root:zone-header, not page content", () => {
    const preset = ZONE_HEADER_PRESETS[0]!;

    applyHeaderZonePreset(preset, appStore);

    const { state } = appStore.getState();
    const headerItems = state.data.zones?.[ROOT_ZONE_HEADER] ?? [];

    expect(headerItems).toHaveLength(1);
    expect(headerItems[0]?.type).toBe("Section");
    expect(state.data.content).toHaveLength(0);
    expect(state.indexes.zones[ROOT_ZONE_HEADER]?.contentIds).toHaveLength(1);
    expect(state.indexes.zones[rootDroppableId]?.contentIds ?? []).toHaveLength(
      0
    );
    expect(state.ui.zonePreviewRoot).toBe(ROOT_ZONE_HEADER);
  });

  it("replaces legacy header zone keys with the canonical zone", () => {
    const preset = ZONE_HEADER_PRESETS[1]!;

    appStore.getState().dispatch({
      type: "set",
      state: walkAppState(
        {
          ...appStore.getState().state,
          data: {
            ...appStore.getState().state.data,
            zones: {
              "root:zone:header": [
                {
                  type: "Section",
                  props: {
                    id: "legacy-header",
                    name: "Legacy",
                    content: [],
                  },
                },
              ],
            },
          },
        },
        config
      ),
      recordHistory: false,
    });

    applyZonePreset(ROOT_ZONE_HEADER, preset, appStore);

    const { state } = appStore.getState();

    expect(state.data.zones?.[ROOT_ZONE_HEADER]).toHaveLength(1);
    expect(state.data.zones?.["root:zone:header"]).toBeUndefined();
    expect(state.data.zones?.[ROOT_ZONE_HEADER]?.[0]?.props?.id).not.toBe(
      "legacy-header"
    );
  });

  it("builds RowGroup children inside the header section", () => {
    const preset = ZONE_HEADER_PRESETS.find(
      (entry) => entry.id === "header-logo-center-actions"
    )!;

    applyHeaderZonePreset(preset, appStore);

    const section = appStore.getState().state.data.zones?.[ROOT_ZONE_HEADER]?.[0];
    const rowGroup = section?.props?.content?.[0];

    expect(rowGroup?.type).toBe("RowGroup");
    expect(rowGroup?.props?.content?.length).toBe(3);
  });
});
