"use client"

import React, { useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import drawerStyles from "../ZoneDrawer/styles.module.css"
import overlayStyles from "../ZoneOverlay/styles.module.css"
import selectionStyles from "../../lib/zone-selection.module.css"

export type MobileSidebarDrawerProps = {
  isOpen: boolean
  /** Highlight + badge while the block is selected in the editor. */
  selected?: boolean
  editMode?: boolean
  side?: "left" | "right"
  title?: string
  showTitle?: boolean
  backgroundColor?: string
  onClose: () => void
  children?: React.ReactNode
}

/**
 * The mobile `Sidebar` block rendered the way the mobile app shows it: an
 * off-canvas drawer with an overlay and a close button, portalled out of the
 * page flow so it never sits on top of the canvas permanently.
 */
export const MobileSidebarDrawer = ({
  isOpen,
  selected = false,
  editMode = false,
  side = "left",
  title,
  showTitle = true,
  backgroundColor,
  onClose,
  children,
}: MobileSidebarDrawerProps) => {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  const sideClass =
    side === "right" ? drawerStyles.sideRight : drawerStyles.sideLeft

  // The canvas lives in an iframe, so portal into *that* document's body.
  // Resolved once — re-creating the portal on every render would remount the
  // panel and restart its transition.
  useLayoutEffect(() => {
    if (portalTarget) return
    const doc = anchorRef.current?.ownerDocument ?? document
    if (doc.body) setPortalTarget(doc.body)
  }, [portalTarget])

  const panel = (
    <div className={drawerStyles.root} data-sooq-mobile-sidebar="">
      <div
        className={`${overlayStyles.overlay} ${
          isOpen ? overlayStyles.overlayOpen : ""
        }`}
        onClick={onClose}
        aria-hidden
      />

      <aside
        className={`${drawerStyles.panel} ${sideClass} ${
          isOpen ? drawerStyles.panelOpen : ""
        } ${selected ? selectionStyles.overlaySelected : ""}`}
        style={{ backgroundColor }}
        role="dialog"
        aria-modal={isOpen ? "true" : "false"}
        aria-hidden={!isOpen}
        data-sooq-mobile-sidebar-panel=""
      >
        {editMode && selected && (
          <div className={overlayStyles.editorBadge} aria-hidden>
            <span className={overlayStyles.editorDot} />
            معاينة القائمة الجانبية — تُفتح من زر القائمة في شريط التطبيق
          </div>
        )}

        <header className={overlayStyles.header}>
          {showTitle && title ? <strong>{title}</strong> : <span />}
          <button
            type="button"
            className={overlayStyles.closeButton}
            onClick={onClose}
            aria-label="إغلاق"
          >
            <X size={18} />
          </button>
        </header>

        <div className={overlayStyles.content}>{children}</div>
      </aside>
    </div>
  )

  return (
    <div ref={anchorRef} style={{ display: "contents" }}>
      {portalTarget ? createPortal(panel, portalTarget) : null}
    </div>
  )
}
