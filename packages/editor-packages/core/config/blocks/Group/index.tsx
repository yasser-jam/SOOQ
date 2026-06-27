import React from "react";
import { ComponentConfig, Slot } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { spacingOptions } from "../../options";
import { resolveColor, colorField } from "../../content/color-fields";
import {
  RADIUS_OPTIONS,
  resolveRadius,
} from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { WithLayout, withLayout } from "../../components/Layout";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Group", styles);

const BOX_SHADOW_PRESETS: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)",
};

function resolveBoxShadow(value?: string): string | undefined {
  if (!value || value === "none") return undefined;
  return BOX_SHADOW_PRESETS[value] ?? value;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type GroupProps = WithLayout<{
  direction: "row" | "column";
  gap: number;
  alignItems: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  justifyContent:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  wrap: "wrap" | "nowrap";
  /** Card-like surface background (theme token or hex/rgba) */
  backgroundColor?: string;
  /** Background image URL (cover, centered) */
  backgroundImage?: string;
  /** Color overlay on top of background image (supports rgba for transparency) */
  backgroundOverlayColor?: string;
  /** Inner padding (spacing preset) */
  padding?: string;
  /** Corner radius (theme token or px) */
  borderRadius?: string;
  /** Shadow preset: none | sm | md | lg */
  boxShadow?: string;
  /** Accepts all blocks, including nested Groups. Section is excluded
   *  because sections are page-level containers only. */
  content: Slot;
}>;

const createGroupStarterContent = (): Slot => [
  {
    type: "ContentParagraph",
    props: {
      text: "Group starter content",
      textAlign: "left",
    },
  },
];

// ─── Config ────────────────────────────────────────────────────────────────

const GroupInternal: ComponentConfig<GroupProps> = {
  label: "مجموعة",

  fields: {
    direction: {
      type: "radio",
      label: "الاتجاه",
      options: [
        { label: "Horizontal", value: "row" },
        { label: "Vertical", value: "column" },
      ],
    },
    gap: {
      type: "number",
      label: "الفجوة (بكسل)",
      min: 0,
      max: 120,
    },
    alignItems: {
      type: "select",
      label: "محاذاة العناصر",
      options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Stretch", value: "stretch" },
        { label: "Baseline", value: "baseline" },
      ],
    },
    justifyContent: {
      type: "select",
      label: "محاذاة المحتوى",
      options: [
        { label: "Start", value: "flex-start" },
        { label: "Center", value: "center" },
        { label: "End", value: "flex-end" },
        { label: "Space Between", value: "space-between" },
        { label: "Space Around", value: "space-around" },
        { label: "Space Evenly", value: "space-evenly" },
      ],
    },
    wrap: {
      type: "radio",
      label: "التفاف",
      options: [
        { label: "Wrap", value: "wrap" },
        { label: "No Wrap", value: "nowrap" },
      ],
    },
    backgroundColor: { ...colorField, label: "لون الخلفية" },
    backgroundImage: {
      type: "text",
      label: "صورة الخلفية (رابط)",
      placeholder: "https://example.com/image.jpg",
      metadata: {
        helpText:
          "رابط اختياري لصورة خلفية. تُعرض كغطاء خلف محتوى المجموعة.",
      },
    },
    backgroundOverlayColor: {
      type: "text",
      label: "لون التغطية فوق الصورة",
      placeholder: "rgba(0, 0, 0, 0.45)",
      metadata: {
        helpText:
          "لون شفاف فوق صورة الخلفية. استخدم rgba للشفافية.",
        example: "rgba(0, 0, 0, 0.45)",
      },
    },
    padding: {
      type: "select",
      label: "الحشو الداخلي",
      options: [{ label: "0px", value: "0px" }, ...spacingOptions],
    },
    borderRadius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
    boxShadow: {
      type: "select",
      label: "الظل",
      options: [
        { label: "None", value: "none" },
        { label: "Small", value: "sm" },
        { label: "Medium", value: "md" },
        { label: "Large", value: "lg" },
      ],
    },
    content: {
      type: "slot",
      disallow: ["Section"],
    },
  },

  defaultProps: {
    direction: "row",
    gap: 16,
    alignItems: "stretch",
    justifyContent: "flex-start",
    wrap: "nowrap",
    backgroundColor: "",
    backgroundImage: "",
    backgroundOverlayColor: "",
    padding: "0px",
    borderRadius: "theme-none",
    boxShadow: "none",
    content: createGroupStarterContent(),
  },

  render: ({
    direction,
    gap,
    alignItems,
    justifyContent,
    wrap,
    backgroundColor,
    backgroundImage,
    backgroundOverlayColor,
    padding,
    borderRadius,
    boxShadow,
    content: Content,
  }) => {
    const bg = (backgroundColor ?? "").trim();
    const bgImage = (backgroundImage ?? "").trim();
    const overlayColor = (backgroundOverlayColor ?? "").trim();
    const pad = padding && padding !== "0px" ? padding : undefined;
    const radius = resolveRadius(borderRadius ?? "theme-none");
    const shadow = resolveBoxShadow(boxShadow);

    return (
      <div
        className={getClassName()}
        style={{
          position: "relative",
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          overflow: "hidden",
          ...(bg && !bgImage ? { backgroundColor: resolveColor(bg) } : {}),
          ...(bgImage
            ? {
                backgroundImage: `url(${bgImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }
            : {}),
          ...(radius && radius !== "0" ? { borderRadius: radius } : {}),
          ...(shadow ? { boxShadow: shadow } : {}),
        }}
      >
        {bgImage && overlayColor ? (
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: resolveColor(overlayColor),
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ) : null}
        <Content
          style={{
            display: "flex",
            flexDirection: direction,
            gap,
            alignItems,
            justifyContent,
            flexWrap: wrap,
            width: "100%",
            minWidth: 0,
            boxSizing: "border-box",
            position: "relative",
            zIndex: 1,
            ...(pad ? { padding: pad } : {}),
          }}
        />
      </div>
    );
  },
};

export const Group = withLayout(GroupInternal);
