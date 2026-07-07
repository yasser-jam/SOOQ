"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X } from "lucide-react";
import { getClassNameFactory } from "../../lib";
import { insertPresetSection } from "../../lib/insert-preset-section";
import { useAppStoreApi } from "../../store";
import {
  PRESET_CATEGORY_LABELS,
  PRESET_CATEGORY_ORDER,
  SECTION_PRESETS,
  type SectionPreset,
  type SectionPresetCategory,
} from "../../config/presets";
import styles from "./add-section-dialog.module.css";

const getClassName = getClassNameFactory("AddSectionDialog", styles);

type AddSectionDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AddSectionDialog({ open, onClose }: AddSectionDialogProps) {
  const storeApi = useAppStoreApi();
  const [tab, setTab] = useState<SectionPresetCategory>("general");
  const isInsertingRef = useRef(false);

  useEffect(() => {
    if (open) {
      isInsertingRef.current = false;
      setTab("general");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(
    () => SECTION_PRESETS.filter((preset) => preset.category === tab),
    [tab]
  );

  const handlePick = useCallback(
    (preset: SectionPreset) => {
      if (isInsertingRef.current) return;
      isInsertingRef.current = true;
      onClose();
      void insertPresetSection(preset, storeApi);
    },
    [onClose, storeApi]
  );

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={getClassName("overlay")}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="إضافة قسم"
    >
      <div className={getClassName("panel")}>
        <div className={getClassName("header")}>
          <div>
            <h2 className={getClassName("title")}>إضافة قسم</h2>
            <p className={getClassName("subtitle")}>
              اختر تخطيطاً جاهزاً. يمكنك تعديل كل عنصر لاحقاً.
            </p>
          </div>
          <button
            type="button"
            className={getClassName("close")}
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        <div className={getClassName("tabs")}>
          {PRESET_CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              className={`${getClassName("tab")} ${
                tab === category ? getClassName("tab--active") : ""
              }`.trim()}
              onClick={() => setTab(category)}
            >
              {PRESET_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <div className={getClassName("body")}>
          {filtered.length === 0 ? (
            <div className={getClassName("empty")}>
              <p>لا توجد قوالب في هذه الفئة بعد.</p>
              <p className={getClassName("emptyHint")}>قريباً.</p>
            </div>
          ) : (
            <div className={getClassName("grid")}>
              {filtered.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={getClassName("card")}
                  onClick={() => handlePick(preset)}
                >
                  <div className={getClassName("cardPreview")}>
                    {preset.previewImage ? (
                      <img
                        src={preset.previewImage}
                        alt=""
                        className={getClassName("cardImage")}
                      />
                    ) : (
                      <div className={getClassName("cardPlaceholder")} />
                    )}
                  </div>
                  <span className={getClassName("cardTitle")}>{preset.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export function AddSectionTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={getClassName("trigger")}
        onClick={() => setOpen(true)}
      >
        <Plus size={16} aria-hidden />
        <span>إضافة قسم</span>
      </button>
      <AddSectionDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
