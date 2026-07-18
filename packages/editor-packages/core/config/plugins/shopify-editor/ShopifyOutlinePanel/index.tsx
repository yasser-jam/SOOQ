"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelLeft, PanelRight, Plus } from "lucide-react";
import { useAppStore } from "@/core/store";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { OPEN_ADD_SECTION_EVENT } from "@/core/components/DropZone";
import {
  ROOT_SHELL_LEFT_ZONE,
  ROOT_SHELL_RIGHT_ZONE,
} from "../../../shell-zones";
import { AddSectionModal } from "../AddSectionModal";
import { TemplateSectionList } from "./TemplateSectionList";
import { sectionCatalog } from "../section-catalog";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

const EMPTY_ZONE_ITEMS: any[] = [];

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
};

type ShellDrawerRowProps = {
  icon: React.ReactNode;
  label: string;
  hint: string;
  selected: boolean;
  disabled: boolean;
  onActivate: () => void;
};

function ShellDrawerRow({
  icon,
  label,
  hint,
  selected,
  disabled,
  onActivate,
}: ShellDrawerRowProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-start transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border/70 bg-card hover:border-primary/30 hover:bg-muted/30",
        disabled && "opacity-70"
      )}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </button>
  );
}

/**
 * Shopify-style left sidebar.
 *
 * Shell chrome is now content-driven, so this panel only renders one
 * component list and insertion controls.
 */
export function ShopifyOutlinePanel() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [insertIndex, setInsertIndex] = useState<number | undefined>(undefined);
  const dispatch = useAppStore((s) => s.dispatch);

  const contentCount = useAppStore((s) => s.state.data.content?.length ?? 0);
  const itemSelector = useAppStore((s) => s.state.ui.itemSelector);
  const leftZoneItems = useAppStore(
    (s) => s.state.data.zones?.[ROOT_SHELL_LEFT_ZONE]
  );
  const rightZoneItems = useAppStore(
    (s) => s.state.data.zones?.[ROOT_SHELL_RIGHT_ZONE]
  );

  const leftDrawer = useMemo(() => {
    const items = leftZoneItems ?? EMPTY_ZONE_ITEMS;
    const index = items.findIndex((item) => item.type === "SiteDrawerShell");
    if (index < 0) return null;

    const data = items[index];
    const id =
      typeof data?.props?.id === "string" ? data.props.id : "site-drawer";
    const side: "left" | "right" =
      data?.props?.side === "right" ? "right" : "left";

    return {
      id,
      side,
      index,
      zone: ROOT_SHELL_LEFT_ZONE,
      data,
    };
  }, [leftZoneItems]);

  const rightDrawer = useMemo(() => {
    const items = rightZoneItems ?? EMPTY_ZONE_ITEMS;
    const index = items.findIndex((item) => item.type === "SiteDrawerShell");
    if (index < 0) return null;

    const data = items[index];
    const id =
      typeof data?.props?.id === "string" ? data.props.id : "site-drawer";
    const side: "left" | "right" =
      data?.props?.side === "right" ? "right" : "left";

    return {
      id,
      side,
      index,
      zone: ROOT_SHELL_RIGHT_ZONE,
      data,
    };
  }, [rightZoneItems]);

  const leftDrawerIndex = leftDrawer?.index ?? -1;
  const rightDrawerIndex = rightDrawer?.index ?? -1;
  const sideChangeSyncRef = useRef<{
    id: string;
    side: "left" | "right";
    zone: string;
  } | null>(null);

  const quickStartPresets = useMemo(
    () =>
      ["hero-band", "two-column", "faq-accordion"]
        .map((id) => sectionCatalog.find((preset) => preset.id === id))
        .filter((preset) => !!preset),
    []
  );

  const openModal = useCallback((index?: number) => {
    setInsertIndex(index);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  useEffect(() => {
    if (leftDrawer && rightDrawer) {
      const keepRight = itemSelector?.zone === ROOT_SHELL_RIGHT_ZONE;

      if (keepRight) {
        dispatch({
          type: "remove",
          zone: ROOT_SHELL_LEFT_ZONE,
          index: leftDrawer.index,
          recordHistory: false,
        });
      } else {
        dispatch({
          type: "remove",
          zone: ROOT_SHELL_RIGHT_ZONE,
          index: rightDrawer.index,
          recordHistory: false,
        });
      }

      sideChangeSyncRef.current = null;
      return;
    }

    const drawer = leftDrawer ?? rightDrawer;
    if (!drawer) {
      sideChangeSyncRef.current = null;
      return;
    }

    const zoneSide: "left" | "right" =
      drawer.zone === ROOT_SHELL_RIGHT_ZONE ? "right" : "left";
    const previous = sideChangeSyncRef.current;
    const isSelected =
      itemSelector?.zone === drawer.zone && itemSelector.index === drawer.index;

    if (
      previous &&
      previous.id === drawer.id &&
      previous.zone === drawer.zone &&
      previous.side !== drawer.side
    ) {
      const targetZone =
        drawer.side === "right" ? ROOT_SHELL_RIGHT_ZONE : ROOT_SHELL_LEFT_ZONE;

      if (targetZone === drawer.zone) {
        sideChangeSyncRef.current = {
          id: drawer.id,
          side: drawer.side,
          zone: drawer.zone,
        };
        return;
      }

      dispatch({ type: "registerZone", zone: targetZone, recordHistory: false });
      dispatch({
        type: "move",
        sourceIndex: drawer.index,
        sourceZone: drawer.zone,
        destinationIndex: 0,
        destinationZone: targetZone,
        recordHistory: false,
      });

      if (isSelected) {
        dispatch({
          type: "setUi",
          ui: {
            itemSelector: { index: 0, zone: targetZone },
            plugin: { current: "fields" },
            leftSideBarVisible: true,
          },
        });
      }

      sideChangeSyncRef.current = {
        id: drawer.id,
        side: drawer.side,
        zone: targetZone,
      };
      return;
    }

    if (drawer.side !== zoneSide) {
      dispatch({
        type: "replace",
        destinationIndex: drawer.index,
        destinationZone: drawer.zone,
        data: {
          ...drawer.data,
          props: {
            ...drawer.data.props,
            side: zoneSide,
          },
        },
        recordHistory: false,
      });

      sideChangeSyncRef.current = {
        id: drawer.id,
        side: zoneSide,
        zone: drawer.zone,
      };
      return;
    }

    sideChangeSyncRef.current = {
      id: drawer.id,
      side: drawer.side,
      zone: drawer.zone,
    };
  }, [
    dispatch,
    itemSelector?.index,
    itemSelector?.zone,
    leftDrawer,
    rightDrawer,
  ]);

  const moveDrawerToZone = useCallback(
    (targetZone: string) => {
      const drawer = leftDrawer ?? rightDrawer;
      if (!drawer) return;

      const targetSide: "left" | "right" =
        targetZone === ROOT_SHELL_RIGHT_ZONE ? "right" : "left";

      dispatch({ type: "registerZone", zone: targetZone, recordHistory: false });

      const destinationIndex = drawer.zone === targetZone ? drawer.index : 0;

      if (drawer.zone !== targetZone) {
        dispatch({
          type: "move",
          sourceIndex: drawer.index,
          sourceZone: drawer.zone,
          destinationIndex,
          destinationZone: targetZone,
          recordHistory: false,
        });
      }

      dispatch({
        type: "replace",
        destinationIndex,
        destinationZone: targetZone,
        data: {
          ...drawer.data,
          props: {
            ...drawer.data.props,
            side: targetSide,
          },
        },
        recordHistory: false,
      });

      dispatch({
        type: "setUi",
        ui: {
          itemSelector: { index: destinationIndex, zone: targetZone },
          plugin: { current: "fields" },
          leftSideBarVisible: true,
        },
      });
    },
    [dispatch, leftDrawer, rightDrawer]
  );

  const selectDrawerInZone = useCallback(
    (zone: string, index: number) => {
      if (index < 0) return;
      dispatch({
        type: "setUi",
        ui: {
          itemSelector: { index, zone },
          plugin: { current: "fields" },
          leftSideBarVisible: true,
        },
      });
    },
    [dispatch]
  );

  const insertPresetNow = useCallback(
    (presetId: string) => {
      const preset = sectionCatalog.find((item) => item.id === presetId);
      if (!preset) return;

      const payload = preset.build();

      dispatch({
        type: "insert",
        componentType: payload.type,
        destinationZone: rootDroppableId,
        destinationIndex: contentCount,
        props: payload.props,
        recordHistory: true,
      });

      dispatch({
        type: "setUi",
        ui: { itemSelector: { index: contentCount, zone: rootDroppableId } },
      });
    },
    [dispatch, contentCount]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key.toLowerCase() !== "a") return;

      e.preventDefault();

      if (e.shiftKey && contentCount === 0) {
        insertPresetNow("hero-band");
        return;
      }

      openModal();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openModal, insertPresetNow, contentCount]);

  useEffect(() => {
    const onOpenRequest = () => openModal();
    window.addEventListener(OPEN_ADD_SECTION_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_ADD_SECTION_EVENT, onOpenRequest);
  }, [openModal]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
        {(leftDrawerIndex >= 0 || rightDrawerIndex >= 0) && (
          <section className="flex flex-col gap-2">
            <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              الأشرطة الجانبية
            </h3>
            <div className="flex flex-col gap-2">
              <ShellDrawerRow
                icon={<PanelLeft size={16} />}
                label="درج جانبي (يسار)"
                hint={
                  leftDrawerIndex >= 0
                    ? "اختر لتعديل الإعدادات"
                    : "انقر لنقل الدرج إلى هنا"
                }
                selected={
                  leftDrawerIndex >= 0 &&
                  itemSelector?.zone === ROOT_SHELL_LEFT_ZONE &&
                  itemSelector.index === leftDrawerIndex
                }
                disabled={leftDrawerIndex < 0}
                onActivate={() =>
                  leftDrawerIndex >= 0
                    ? selectDrawerInZone(ROOT_SHELL_LEFT_ZONE, leftDrawerIndex)
                    : moveDrawerToZone(ROOT_SHELL_LEFT_ZONE)
                }
              />
              <ShellDrawerRow
                icon={<PanelRight size={16} />}
                label="درج جانبي (يمين)"
                hint={
                  rightDrawerIndex >= 0
                    ? "اختر لتعديل الإعدادات"
                    : "انقر لنقل الدرج إلى هنا"
                }
                selected={
                  rightDrawerIndex >= 0 &&
                  itemSelector?.zone === ROOT_SHELL_RIGHT_ZONE &&
                  itemSelector.index === rightDrawerIndex
                }
                disabled={rightDrawerIndex < 0}
                onActivate={() =>
                  rightDrawerIndex >= 0
                    ? selectDrawerInZone(ROOT_SHELL_RIGHT_ZONE, rightDrawerIndex)
                    : moveDrawerToZone(ROOT_SHELL_RIGHT_ZONE)
                }
              />
            </div>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <h3 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            أقسام الصفحة
          </h3>

          {contentCount === 0 ? (
            <Card className="border-dashed">
              <CardHeader className="pb-2 text-center">
                <CardTitle className="text-sm">لا توجد أقسام بعد</CardTitle>
                <CardDescription className="text-xs">
                  ابدأ بقالب جاهز لبناء صفحتك أسرع، أو اضغط A لفتح مكتبة
                  الأقسام.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0">
                {quickStartPresets.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => insertPresetNow(preset.id)}
                  >
                    {preset.label}
                  </Button>
                ))}
                <p className="pt-1 text-center text-[11px] text-muted-foreground">
                  تلميح: اضغط Shift+A لإدراج قسم هيرو فوراً.
                </p>
              </CardContent>
            </Card>
          ) : (
            <TemplateSectionList onAddSection={openModal} />
          )}

          <Button
            type="button"
            variant={contentCount === 0 ? "default" : "outline"}
            className="w-full"
            onClick={() => openModal()}
            title="إضافة قسم (A)"
            aria-keyshortcuts="A"
          >
            <Plus data-icon="inline-start" />
            إضافة قسم
          </Button>
        </section>
      </div>

      <AddSectionModal
        open={isModalOpen}
        onClose={closeModal}
        insertIndex={insertIndex}
      />
    </div>
  );
}
