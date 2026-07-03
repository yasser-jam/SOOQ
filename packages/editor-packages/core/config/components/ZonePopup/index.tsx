"use client";

import React from "react";
import { X } from "lucide-react";
import responsiveStyles from "../../lib/zone-responsive.module.css";
import overlayStyles from "../ZoneOverlay/styles.module.css";
import {
  useZoneOverlay,
  useZonePortalTarget,
} from "../ZoneOverlay/useZoneOverlay";
import { useZonePreviewSelected } from "../../lib/use-zone-preview-selected";
import selectionStyles from "../../lib/zone-selection.module.css";

import styles from "./styles.module.css";

export type ZonePopupProps = {
  zoneKey: string;
  isActive?: boolean;
  isMobileOnly?: boolean;
  backgroundColor?: string;
  borderRadius?: string;
  maxWidth?: string;
  overlay?: boolean;
  showCloseButton?: boolean;
  editMode?: boolean;
  componentId?: string;
  children?: React.ReactNode;
};

export const ZonePopup = ({
  zoneKey,
  isActive = false,
  isMobileOnly = false,
  backgroundColor = "#ffffff",
  borderRadius = "12px",
  maxWidth = "480px",
  overlay = true,
  showCloseButton = true,
  editMode = false,
  componentId,
  children,
}: ZonePopupProps) => {
  const previewSelected = useZonePreviewSelected(componentId);
  const { isOpen, close, shouldRender } = useZoneOverlay({
    zoneKey,
    isActive,
    editMode,
    previewSelected,
  });
  const { Portal } = useZonePortalTarget();

  if (!shouldRender) return null;

  const deviceClass = isMobileOnly ? responsiveStyles.hideOnDesktop : "";

  const panel = (
    <div
      className={`${styles.root} ${deviceClass}`.trim()}
      data-zone-key={zoneKey}
    >
      {overlay && (!editMode || previewSelected) && (
        <div
          className={`${overlayStyles.overlay} ${
            isOpen ? overlayStyles.overlayOpen : ""
          }`}
          onClick={close}
          aria-hidden
        />
      )}

      <div
        className={`${styles.dialog} ${isOpen ? styles.dialogOpen : ""} ${
          previewSelected ? selectionStyles.overlaySelected : ""
        }`}
        style={{ backgroundColor, borderRadius, maxWidth }}
        role="dialog"
        aria-modal={isOpen ? "true" : "false"}
        aria-hidden={!isOpen}
        data-sooq-zone-panel={zoneKey}
      >
        {editMode && previewSelected && (
          <div className={overlayStyles.editorBadge} aria-hidden>
            <span className={overlayStyles.editorDot} />
            معاينة النافذة — عدّل الإعدادات من الشريط الجانبي
          </div>
        )}

        {(showCloseButton || editMode) && (
          <header className={overlayStyles.header}>
            <span />
            <button
              type="button"
              className={overlayStyles.closeButton}
              onClick={close}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </header>
        )}

        <div className={overlayStyles.content}>{children}</div>
      </div>
    </div>
  );

  return <Portal>{panel}</Portal>;
};
