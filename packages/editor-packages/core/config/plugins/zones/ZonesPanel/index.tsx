"use client";

import React, { useCallback, useMemo } from "react";
import { Check, ChevronRight } from "lucide-react";
import { useAppStore, useAppStoreApi } from "@/core/store";
import { getClassNameFactory } from "@/core/lib";
import { getItem } from "@/core/lib/data/get-item";
import { ensureZoneBlockSelector } from "../../../lib/ensure-zone-selection";
import {
  ZONE_DEFINITIONS,
  type ZoneDefinition,
} from "../../../lib/zone-registry";
import { cn } from "@workspace/ui/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ZonesPanel", styles);

const isZoneActive = (
  blockType: string,
  props: Record<string, unknown> | undefined
): boolean => {
  if (!props) return false;

  if (blockType === "SiteHeader" || blockType === "SiteFooter") {
    return props.visible !== false;
  }

  return props.is_active === true;
};

const getZoneStatusLabel = (active: boolean, configured: boolean) => {
  if (!configured) return "غير مُعدّ";
  return active ? "مفعّل" : "معطّل";
};

export function ZonesPanel() {
  const dispatch = useAppStore((s) => s.dispatch);
  const appStoreApi = useAppStoreApi();
  const zones = useAppStore((s) => s.state.data.zones ?? {});
  const itemSelector = useAppStore((s) => s.state.ui.itemSelector);
  const state = useAppStore((s) => s.state);

  const selectedZoneId = useMemo(() => {
    if (!itemSelector) return null;

    const item = getItem(itemSelector, state);
    if (!item) return null;

    const definition = ZONE_DEFINITIONS.find(
      (zone) => zone.blockType === item.type
    );
    return definition?.id ?? null;
  }, [itemSelector, state]);

  const zoneCards = useMemo(() => {
    return ZONE_DEFINITIONS.map((definition) => {
      const items = zones[definition.rootZone] ?? [];
      const index = items.findIndex((item) => item.type === definition.blockType);
      const block = index >= 0 ? items[index] : null;
      const props = (block?.props ?? {}) as Record<string, unknown>;
      const configured = index >= 0;
      const active = configured && isZoneActive(definition.blockType, props);

      return {
        definition,
        index,
        configured,
        active,
        title:
          typeof props.title === "string" && props.title.trim()
            ? props.title
            : definition.title,
        eventKey:
          typeof props.key === "string" && props.key.trim()
            ? props.key
            : undefined,
      };
    });
  }, [zones]);

  const deselectZone = useCallback(() => {
    dispatch({
      type: "setUi",
      ui: {
        itemSelector: null,
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

      const selector = await ensureZoneBlockSelector(
        definition.rootZone,
        definition.blockType,
        appStoreApi
      );

      if (!selector) return;

      dispatch({
        type: "setUi",
        ui: {
          itemSelector: selector,
          plugin: { current: "zones" },
          leftSideBarVisible: true,
          rightSideBarVisible: true,
        },
      });
    },
    [appStoreApi, deselectZone, dispatch, selectedZoneId]
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
        {zoneCards.map(
          ({ definition, configured, active, title, eventKey }) => {
            const Icon = definition.icon;
            const isSelected = selectedZoneId === definition.id;

            return (
              <button
                key={definition.id}
                type="button"
                className={cn(getClassName("cardButton"), isSelected && styles.cardSelected)}
                onClick={() => selectZone(definition)}
              >
                <Card className={cn("text-start", isSelected && "border-primary ring-2 ring-primary/20")}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg",
                            isSelected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Icon size={18} />
                        </span>
                        <div>
                          <CardTitle className="text-base">{definition.title}</CardTitle>
                          <CardDescription className="text-xs">
                            {configured && title !== definition.title ? title : definition.description}
                          </CardDescription>
                        </div>
                      </div>
                      {isSelected ? (
                        <Check size={18} className="text-primary shrink-0" />
                      ) : (
                        <ChevronRight size={18} className="text-muted-foreground shrink-0" />
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
          }
        )}
      </div>
    </div>
  );
}
