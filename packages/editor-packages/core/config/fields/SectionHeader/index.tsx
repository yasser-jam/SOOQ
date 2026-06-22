import React from "react";

import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("SectionHeader", styles);

/**
 * SectionHeader — a visual-only "field" used in root (and any complex block
 * config) to divide a long list of properties into clearly named groups.
 *
 * It has no data: the field persists nothing to `store_config.json`. Puck
 * just renders whatever `render` returns at the field's position in the
 * panel, and we stash a dummy value through `onChange` only if the user
 * interacts.
 *
 *     myGroupHeader: sectionHeader({
 *       title: "Drawer",
 *       description: "Site-wide slide-out menu",
 *       icon: <PanelLeft size={14} />,
 *     }),
 */

export type SectionHeaderProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /** A small coloured stripe on the left — use to visually group related sections. */
  accent?: "blue" | "purple" | "green" | "amber" | "rose" | "slate";
};

const ACCENT_COLORS: Record<
  NonNullable<SectionHeaderProps["accent"]>,
  string
> = {
  blue: "#3b82f6",
  purple: "#8b5cf6",
  green: "#10b981",
  amber: "#f59e0b",
  rose: "#f43f5e",
  slate: "#64748b",
};

export function SectionHeader({
  title,
  description,
  icon,
  accent = "slate",
}: SectionHeaderProps) {
  const color = ACCENT_COLORS[accent];
  return (
    <div
      className={getClassName()}
      style={{ ["--sh-accent" as any]: color }}
      role="separator"
      aria-label={title}
    >
      <div className={getClassName("titleRow")}>
        {icon && (
          <span className={getClassName("icon")} aria-hidden>
            {icon}
          </span>
        )}
        <span className={getClassName("title")}>{title}</span>
      </div>
      {description && (
        <p className={getClassName("description")}>{description}</p>
      )}
    </div>
  );
}

/**
 * Convenience helper to declare a section header as a Puck `custom` field.
 * The field is contentEditable:false so nothing can be stashed in it, and
 * the render ignores `value`/`onChange` completely.
 */
export const sectionHeader = (options: SectionHeaderProps) =>
  ({
    type: "custom" as const,
    label: options.title,
    render: () => (
      <SectionHeader
        title={options.title}
        description={options.description}
        icon={options.icon}
        accent={options.accent}
      />
    ),
  });
