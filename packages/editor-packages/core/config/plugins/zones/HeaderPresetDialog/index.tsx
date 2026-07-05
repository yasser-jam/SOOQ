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
import { applyZonePreset } from "../../../lib/apply-zone-preset";
import { ZONE_HEADER_PRESETS } from "../../../presets/header";
import type { ZonePreset } from "../../../presets/types";
import styles from "./header-preset-dialog.module.css";

type HeaderPresetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rootZone: string;
};

export function HeaderPresetDialog({
  open,
  onOpenChange,
  rootZone,
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
    (preset: ZonePreset) => {
      if (isApplyingRef.current) return;
      isApplyingRef.current = true;
      onOpenChange(false);
      applyZonePreset(rootZone, preset, appStoreApi);
      isApplyingRef.current = false;
    },
    [appStoreApi, onOpenChange, rootZone]
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
      </DialogContent>
    </Dialog>,
    portalTarget
  );
}
