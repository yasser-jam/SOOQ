"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { useAppStoreApi } from "@/core/store";
import { applyHeaderZonePreset } from "../../../lib/apply-zone-preset";
import { ZONE_HEADER_PRESETS } from "../../../presets";
import {
  getPagesMenuHeaderPreset,
  getPagesMenuResponsiveHeaderPreset,
} from "../../../presets/pages-menu";
import type { ZonePreset } from "../../../presets/types";
import styles from "./header-preset-dialog.module.css";

type HeaderPresetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HeaderPresetDialog({
  open,
  onOpenChange,
}: HeaderPresetDialogProps) {
  const appStoreApi = useAppStoreApi();
  const isApplyingRef = useRef(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof document !== "undefined") {
      setPortalTarget(document.body);
    }
  }, []);

  const handlePick = useCallback(
    (preset: ZonePreset | (() => ZonePreset)) => {
      if (isApplyingRef.current) return;
      isApplyingRef.current = true;
      onOpenChange(false);
      const resolved = typeof preset === "function" ? preset() : preset;
      applyHeaderZonePreset(resolved, appStoreApi);
      isApplyingRef.current = false;
    },
    [appStoreApi, onOpenChange]
  );

  if (!portalTarget) return null;

  return createPortal(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className={cn(styles.content, "gap-6")}
        overlayClassName={styles.overlay}
      >
        <DialogHeader>
          <DialogTitle>اختر قالب الرأس</DialogTitle>
          <DialogDescription>
            اختر تخطيطاً جاهزاً. يمكنك تعديل كل عنصر ولون الخلفية بعد التطبيق.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.grid}>
          {ZONE_HEADER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={styles.card}
              onClick={() => handlePick(preset)}
            >
              <div className={styles.cardPreview}>
                {preset.previewImage ? (
                  <img
                    src={preset.previewImage}
                    alt=""
                    className={styles.cardImage}
                  />
                ) : (
                  <div className={styles.cardPlaceholder} />
                )}
              </div>
              <span className={styles.cardTitle}>{preset.title}</span>
            </button>
          ))}
        </div>

        <section className={styles.pagesMenuSection}>
          <h3 className={styles.pagesMenuTitle}>قائمة صفحات الموقع</h3>
          <p className={styles.pagesMenuDescription}>
            ينشئ رابطاً مستقلاً لكل صفحة. تُحدَّث الروابط تلقائياً عند إضافة
            صفحة أو حذفها، مع إمكانية تعديل كل رابط على حدة.
          </p>
          <div className={styles.grid}>
            <button
              type="button"
              className={styles.card}
              onClick={() => handlePick(getPagesMenuHeaderPreset)}
            >
              <div className={styles.cardPreview}>
                <img
                  src="https://placehold.co/800x240/f0f9ff/0284c7?text=Pages+Menu+Header"
                  alt=""
                  className={styles.cardImage}
                />
              </div>
              <span className={styles.cardTitle}>قائمة صفحات الموقع</span>
            </button>
            <button
              type="button"
              className={styles.card}
              onClick={() => handlePick(getPagesMenuResponsiveHeaderPreset)}
            >
              <div className={styles.cardPreview}>
                <img
                  src="https://placehold.co/800x240/f0f9ff/0284c7?text=Pages+Menu+Responsive"
                  alt=""
                  className={styles.cardImage}
                />
              </div>
              <span className={styles.cardTitle}>قائمة صفحات — رأس متجاوب</span>
            </button>
          </div>
        </section>
      </DialogContent>
    </Dialog>,
    portalTarget
  );
}
