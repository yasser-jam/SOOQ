"use client";
import React, { type RefObject } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  Copy,
  CopyPlus,
  Eye,
  EyeOff,
  MousePointer2,
  Trash2,
} from "lucide-react";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";
import { hasClipboardContent } from "./lib/clipboard";
import type { MenuState } from "./lib/types";
import type { ComponentActions } from "./lib/use-component-actions";

const getClassName = getClassNameFactory("CanvasContextMenu", styles);

function getPortalRoot(): HTMLElement | null {
  if (typeof document === "undefined") {
    return null;
  }
  let root = document.getElementById("canvas-context-menu-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "canvas-context-menu-root";
    document.body.appendChild(root);
  }
  return root;
}

type MenuItemProps = {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
};

function MenuItem({
  icon,
  label,
  shortcut,
  danger,
  disabled,
  onSelect,
}: MenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      // Use mousedown (not click) so we fire BEFORE any close-on-outside
      // handler that might unmount the button between mousedown and click.
      // Also preventDefault so the button doesn't steal focus from the
      // iframe's canvas (which would scroll it into view).
      onMouseDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        e.stopPropagation();
        onSelect();
      }}
      onClick={(e) => {
        // mousedown handled everything; swallow click so nothing below reacts.
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`${getClassName("item")} ${
        danger ? getClassName("item--danger") : ""
      }`.trim()}
    >
      <span className={getClassName("itemIcon")} aria-hidden>
        {icon}
      </span>
      <span className={getClassName("itemLabel")}>{label}</span>
      {shortcut && <span className={getClassName("shortcut")}>{shortcut}</span>}
    </button>
  );
}

/**
 * The context-menu popup itself (D-7 portal component). Pure rendering —
 * targeting, dismissal, and actions come from the hooks in `lib/`.
 */
export function ContextMenuPortal({
  menu,
  menuRef,
  actions,
  modKeyLabel,
  deleteKeyLabel,
  onClose,
}: {
  menu: MenuState | null;
  menuRef: RefObject<HTMLDivElement | null>;
  actions: ComponentActions;
  modKeyLabel: string;
  deleteKeyLabel: string;
  onClose: () => void;
}) {
  const portalRoot = typeof document !== "undefined" ? getPortalRoot() : null;

  if (!menu || !portalRoot) return null;

  const loc = actions.resolveLocation(menu.targetId);
  const visible =
    (loc?.data.props as { visible?: boolean } | undefined)?.visible !== false;
  const canMoveUp = !!loc && loc.index > 0;
  const canMoveDown = !!loc && loc.index < loc.zoneLength - 1;

  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return createPortal(
    <div
      ref={menuRef}
      className={getClassName()}
      style={{ left: menu.x, top: menu.y }}
      role="menu"
      dir="rtl"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className={getClassName("header")}>
        <span className={getClassName("headerName")}>{menu.targetLabel}</span>
      </div>

      <div className={getClassName("group")}>
        <MenuItem
          icon={<MousePointer2 size={14} />}
          label="تحديد"
          onSelect={run(() => actions.doSelect(menu.targetId))}
        />
      </div>

      <div className={getClassName("group")}>
        <MenuItem
          icon={<Copy size={14} />}
          label="نسخ"
          shortcut={`${modKeyLabel} C`}
          onSelect={run(() => actions.doCopy(menu.targetId))}
        />
        <MenuItem
          icon={<ClipboardPaste size={14} />}
          label="لصق أسفله"
          shortcut={`${modKeyLabel} V`}
          disabled={!hasClipboardContent()}
          onSelect={run(() => actions.doPaste(menu.targetId))}
        />
        <MenuItem
          icon={<CopyPlus size={14} />}
          label="تكرار"
          shortcut={`${modKeyLabel} D`}
          onSelect={run(() => actions.doDuplicate(menu.targetId))}
        />
      </div>

      <div className={getClassName("group")}>
        <MenuItem
          icon={<ArrowUp size={14} />}
          label="نقل لأعلى"
          shortcut={`${modKeyLabel} ↑`}
          disabled={!canMoveUp}
          onSelect={run(() => actions.doMove(menu.targetId, -1))}
        />
        <MenuItem
          icon={<ArrowDown size={14} />}
          label="نقل لأسفل"
          shortcut={`${modKeyLabel} ↓`}
          disabled={!canMoveDown}
          onSelect={run(() => actions.doMove(menu.targetId, 1))}
        />
      </div>

      <div className={getClassName("group")}>
        <MenuItem
          icon={visible ? <EyeOff size={14} /> : <Eye size={14} />}
          label={visible ? "إخفاء" : "إظهار"}
          shortcut="H"
          onSelect={run(() => actions.doToggleHidden(menu.targetId))}
        />
        <MenuItem
          icon={<Trash2 size={14} />}
          label="حذف"
          shortcut={deleteKeyLabel}
          danger
          onSelect={run(() => actions.doRemove(menu.targetId))}
        />
      </div>
    </div>,
    portalRoot
  );
}
