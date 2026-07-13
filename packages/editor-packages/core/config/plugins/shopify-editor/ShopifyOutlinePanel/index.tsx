"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PanelLeft, PanelRight, Plus } from "lucide-react";
import { useAppStore } from "@/core/store";
import { getClassNameFactory } from "@/core/lib";
import { rootDroppableId } from "@/core/lib/root-droppable-id";
import { OPEN_ADD_SECTION_EVENT } from "@/core/components/DropZone";
import {
  ROOT_SHELL_LEFT_ZONE,
  ROOT_SHELL_RIGHT_ZONE,
} from "../../../shell-zones";
import { AddSectionModal } from "../AddSectionModal";
import { TemplateSectionList } from "./TemplateSectionList";
import { sectionCatalog } from "../section-catalog";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ShopifyOutlinePanel", styles);
const EMPTY_ZONE_ITEMS: any[] = [];

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
};

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
            rightSideBarVisible: false,
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
          rightSideBarVisible: false,
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
          rightSideBarVisible: false,
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

  // Canvas empty-page CTA (D-2) asks for the section library via this event.
  useEffect(() => {
    const onOpenRequest = () => openModal();
    window.addEventListener(OPEN_ADD_SECTION_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_ADD_SECTION_EVENT, onOpenRequest);
  }, [openModal]);

  return (
    <div className={getClassName()}>
      <div className={getClassName("scroll")}>
        <div className={getClassName("guide")}>
          <strong>ابنِ صفحتك من أقسام</strong>
          <span>
            أضف قسماً ثم اسحب عناصر المحتوى أو عناصر المتجر داخله. اختر أي صف
            بالأسفل لتعديل إعداداته.
          </span>
        </div>

        {(leftDrawerIndex >= 0 || rightDrawerIndex >= 0) && (
          <div className={getClassName("group")}>
            <div className={getClassName("groupHeader")}>الأشرطة الجانبية</div>
            <div className={getClassName("groupBody")}>
              <div
                className={`${getClassName("shellRow")} ${
                  leftDrawerIndex < 0 ? getClassName("shellRow--disabled") : ""
                } ${
                  leftDrawerIndex >= 0 &&
                  itemSelector?.zone === ROOT_SHELL_LEFT_ZONE &&
                  itemSelector.index === leftDrawerIndex
                    ? getClassName("shellRow--selected")
                    : ""
                }`.trim()}
                role="button"
                tabIndex={0}
                onClick={() =>
                  leftDrawerIndex >= 0
                    ? selectDrawerInZone(ROOT_SHELL_LEFT_ZONE, leftDrawerIndex)
                    : moveDrawerToZone(ROOT_SHELL_LEFT_ZONE)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (leftDrawerIndex >= 0) {
                      selectDrawerInZone(ROOT_SHELL_LEFT_ZONE, leftDrawerIndex);
                    } else {
                      moveDrawerToZone(ROOT_SHELL_LEFT_ZONE);
                    }
                  }
                }}
              >
                <span className={getClassName("fixedIcon")} aria-hidden>
                  <PanelLeft size={14} />
                </span>
                <div className={getClassName("fixedMeta")}>
                  <span className={getClassName("fixedLabel")}>
                    درج جانبي (يسار)
                  </span>
                  <span className={getClassName("fixedHint")}>
                    {leftDrawerIndex >= 0
                      ? "اختر لتعديل الإعدادات"
                      : "انقر لنقل الدرج إلى هنا"}
                  </span>
                </div>
              </div>

              <div
                className={`${getClassName("shellRow")} ${
                  rightDrawerIndex < 0 ? getClassName("shellRow--disabled") : ""
                } ${
                  rightDrawerIndex >= 0 &&
                  itemSelector?.zone === ROOT_SHELL_RIGHT_ZONE &&
                  itemSelector.index === rightDrawerIndex
                    ? getClassName("shellRow--selected")
                    : ""
                }`.trim()}
                role="button"
                tabIndex={0}
                onClick={() =>
                  rightDrawerIndex >= 0
                    ? selectDrawerInZone(ROOT_SHELL_RIGHT_ZONE, rightDrawerIndex)
                    : moveDrawerToZone(ROOT_SHELL_RIGHT_ZONE)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (rightDrawerIndex >= 0) {
                      selectDrawerInZone(ROOT_SHELL_RIGHT_ZONE, rightDrawerIndex);
                    } else {
                      moveDrawerToZone(ROOT_SHELL_RIGHT_ZONE);
                    }
                  }
                }}
              >
                <span className={getClassName("fixedIcon")} aria-hidden>
                  <PanelRight size={14} />
                </span>
                <div className={getClassName("fixedMeta")}>
                  <span className={getClassName("fixedLabel")}>
                    درج جانبي (يمين)
                  </span>
                  <span className={getClassName("fixedHint")}>
                    {rightDrawerIndex >= 0
                      ? "اختر لتعديل الإعدادات"
                      : "انقر لنقل الدرج إلى هنا"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={getClassName("group")}>
          <div className={getClassName("groupHeader")}>أقسام الصفحة</div>
          <div className={getClassName("groupBody")}>
            {contentCount === 0 ? (
              <div className={getClassName("emptyTemplate")}>
                <p className={getClassName("emptyTemplateTitle")}>
                  لا توجد أقسام بعد.
                </p>
                <p className={getClassName("emptyTemplateHint")}>
                  ابدأ بقالب جاهز لبناء صفحتك أسرع، أو اضغط A لفتح مكتبة
                  الأقسام.
                </p>
                <div className={getClassName("quickStart")}>
                  {quickStartPresets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={getClassName("quickStartBtn")}
                      onClick={() => insertPresetNow(preset.id)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <p className={getClassName("shortcutHint")}>
                  تلميح: اضغط Shift+A لإدراج قسم هيرو فوراً.
                </p>
              </div>
            ) : (
              <TemplateSectionList onAddSection={openModal} />
            )}

            <button
              type="button"
              className={`${getClassName("addSection")} ${
                contentCount === 0 ? getClassName("addSection--primary") : ""
              }`.trim()}
              onClick={() => openModal()}
              title="إضافة قسم (A)"
              aria-keyshortcuts="A"
            >
              <Plus size={14} />
              إضافة قسم
            </button>
          </div>
        </div>
      </div>

      <AddSectionModal
        open={isModalOpen}
        onClose={closeModal}
        insertIndex={insertIndex}
      />
    </div>
  );
}
