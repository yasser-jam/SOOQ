"use client";

import React, { useCallback, useMemo } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { getClassNameFactory } from "@/core/lib";
import { applyZonePreset } from "../../../lib/apply-zone-preset";
import {
  ensureZoneBlockSelector,
  ensureZoneSectionSelector,
} from "../../../lib/ensure-zone-selection";
import {
  ZONE_DEFINITIONS,
  getZoneDefinitionByRootZone,
  type ZoneDefinition,
} from "../../../lib/zone-registry";
import { resolveZoneDefinitionFromState } from "../../../lib/zone-selection";
import { DEFAULT_ZONE_POPUP_PRESET } from "../../../presets/popup";
import { DEFAULT_ZONE_FOOTER_PRESET } from "../../../presets/footer";
import { DEFAULT_ZONE_HEADER_PRESET } from "../../../presets/header";
import { getZonePresetsByCategory } from "../../../presets/index";
import type { ZonePreset } from "../../../presets/types";
import { cn } from "@workspace/ui/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { useShallow } from "zustand/react/shallow";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ZonesPanel", styles);

const EMPTY_ZONE_ITEMS: never[] = [];

const resolveZoneDefinition = (
  item: { type: string; props?: { id?: string } } | null,
  itemSelector: { zone?: string; index?: number } | null,
  state: Parameters<typeof resolveZoneDefinitionFromState>[0]
): ZoneDefinition | undefined => {
  return resolveZoneDefinitionFromState(state, itemSelector, item ?? undefined);
};

const isZoneActive = (
  definition: ZoneDefinition,
  props: Record<string, unknown> | undefined
): boolean => {
  if (!props) return false;

  if (definition.isPresetZone) {
    return props.visible !== false;
  }

  return props.is_active === true;
};

const getZoneBlock = (definition: ZoneDefinition, items: { type: string }[]) => {
  if (definition.isPresetZone) {
    return items.find((item) => item.type === "Section") ?? null;
  }

  return items.find((item) => item.type === definition.blockType) ?? null;
};

const getZoneDisplayTitle = (
  definition: ZoneDefinition,
  props: Record<string, unknown>
) => {
  if (definition.isPresetZone) {
    const name = props.name;
    if (typeof name === "string" && name.trim()) return name;
  }

  const title = props.title;
  if (typeof title === "string" && title.trim()) return title;

  return definition.title;
};

const getZoneStatusLabel = (active: boolean, configured: boolean) => {
  if (!configured) return "غير مُعدّ";
  return active ? "مفعّل" : "معطّل";
};

export function ZonesPanel() {
  const dispatch = useAppStore((s) => s.dispatch);
  const appStoreApi = useAppStoreApi();
  const zones = useAppStore((s) => s.state.data.zones);
  const itemSelector = useAppStore(useShallow((s) => s.state.ui.itemSelector));
  const selectedItem = useAppStore((s) => s.selectedItem);
  const appState = useAppStore((s) => s.state);

  const selectedZoneDefinition = useMemo(() => {
    if (appState.ui.zonePreviewRoot) {
      const fromPreview = getZoneDefinitionByRootZone(appState.ui.zonePreviewRoot);
      if (fromPreview) return fromPreview;
    }

    return (
      resolveZoneDefinition(selectedItem ?? null, itemSelector, appState) ??
      null
    );
  }, [appState, itemSelector, selectedItem]);

  const selectedZoneId = selectedZoneDefinition?.id ?? null;

  const zoneCards = useMemo(() => {
    return ZONE_DEFINITIONS.map((definition) => {
      const items = zones?.[definition.rootZone] ?? EMPTY_ZONE_ITEMS;
      const block = getZoneBlock(definition, items);
      const props = (block?.props ?? {}) as Record<string, unknown>;
      const configured = block !== null;
      const active = configured && isZoneActive(definition, props);

      return {
        definition,
        configured,
        active,
        title: getZoneDisplayTitle(definition, props),
        eventKey:
          typeof props.key === "string" && props.key.trim()
            ? props.key
            : undefined,
      };
    });
  }, [zones]);

  const zonePresets = useMemo(() => {
    if (!selectedZoneDefinition?.presetCategory) return [];
    return getZonePresetsByCategory(selectedZoneDefinition.presetCategory);
  }, [selectedZoneDefinition]);

  const deselectZone = useCallback(() => {
    dispatch({
      type: "setUi",
      ui: {
        itemSelector: null,
        zonePreviewRoot: null,
        plugin: { current: "zones" },
        leftSideBarVisible: true,
        rightSideBarVisible: false,
      },
    });
  }, [dispatch]);

  const selectZone = useCallback(
    async (definition: ZoneDefinition) => {
      const isAlreadySelected = selectedZoneId === definition.id;

      if (isAlreadySelected) {
        deselectZone();
        return;
      }

      let selector = definition.isPresetZone
        ? await ensureZoneSectionSelector(
            definition.rootZone,
            definition.presetCategory === "zone-footer"
              ? DEFAULT_ZONE_FOOTER_PRESET
              : DEFAULT_ZONE_HEADER_PRESET,
            appStoreApi
          )
        : await ensureZoneBlockSelector(
            definition.rootZone,
            definition.blockType,
            appStoreApi
          );

      if (
        definition.blockType === "ZonePopup" &&
        appStoreApi.getState().state.data.zones?.[definition.rootZone]?.some(
          (item) =>
            item.type === "ZonePopup" &&
            Array.isArray(item.props?.slot) &&
            item.props.slot.length === 0
        )
      ) {
        selector = applyZonePreset(
          definition.rootZone,
          DEFAULT_ZONE_POPUP_PRESET,
          appStoreApi
        );
      }

      if (!selector) return;

      dispatch({
        type: "setUi",
        ui: {
          itemSelector: selector,
          zonePreviewRoot: definition.rootZone,
          plugin: { current: "zones" },
          leftSideBarVisible: true,
          rightSideBarVisible: true,
        },
      });
    },
    [appStoreApi, deselectZone, dispatch, selectedZoneId]
  );

  const applyPreset = useCallback(
    (preset: ZonePreset) => {
      if (!selectedZoneDefinition) return;

      applyZonePreset(selectedZoneDefinition.rootZone, preset, appStoreApi);

      dispatch({
        type: "setUi",
        ui: {
          plugin: { current: "zones" },
          leftSideBarVisible: true,
          rightSideBarVisible: true,
        },
      });
    },
    [appStoreApi, dispatch, selectedZoneDefinition]
  );

  return (
    <div className={getClassName()}>
      <header className={getClassName("header")}>
        <h2 className={getClassName("title")}>مناطق الموقع</h2>
        <p className={getClassName("subtitle")}>
          اختر منطقة لمعاينتها وتعديل خصائصها. انقر مرة أخرى لإغلاق المعاينة.
        </p>
      </header>

      <div className={getClassName("grid")}>
        {zoneCards.map(({ definition, configured, active, title, eventKey }) => {
          const Icon = definition.icon;
          const isSelected = selectedZoneId === definition.id;

          return (
            <button
              key={definition.id}
              type="button"
              className={cn(
                getClassName("cardButton"),
                isSelected && styles.cardSelected
              )}
              onClick={() => selectZone(definition)}
            >
              <Card
                className={cn(
                  "text-start",
                  isSelected && "border-primary ring-2 ring-primary/20"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon size={18} />
                      </span>
                      <div>
                        <CardTitle className="text-base">
                          {definition.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {configured && title !== definition.title
                            ? title
                            : definition.description}
                        </CardDescription>
                      </div>
                    </div>
                    {isSelected ? (
                      <Check size={18} className="text-primary shrink-0" />
                    ) : (
                      <ChevronRight
                        size={18}
                        className="text-muted-foreground shrink-0"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={active ? "default" : "secondary"}>
                      {getZoneStatusLabel(active, configured)}
                    </Badge>
                    {eventKey && definition.isOverlay ? (
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {eventKey}
                      </Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {selectedZoneDefinition?.presetCategory && zonePresets.length > 0 ? (
        <section className={getClassName("presets")}>
          <div className={getClassName("presetsHeader")}>
            <h3 className={getClassName("presetsTitle")}>قوالب {selectedZoneDefinition.title}</h3>
            <p className={getClassName("presetsSubtitle")}>
              اختر قالباً لاستبدال محتوى المنطقة. يمكنك تعديل المحتوى بعد التطبيق.
            </p>
          </div>
          <div className={getClassName("presetGrid")}>
            {zonePresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={getClassName("presetCard")}
                onClick={() => applyPreset(preset)}
              >
                <div className={getClassName("presetPreview")}>
                  {preset.previewImage ? (
                    <img
                      src={preset.previewImage}
                      alt=""
                      className={getClassName("presetImage")}
                    />
                  ) : (
                    <div className={getClassName("presetPlaceholder")} />
                  )}
                </div>
                <span className={getClassName("presetLabel")}>{preset.title}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
