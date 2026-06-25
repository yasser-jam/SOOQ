import React, { lazy, Suspense } from "react";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { ComponentConfig } from "@/core/types";
import { WithLayout, withLayout } from "../../components/Layout";
import { colorVar, ColorKey, COLOR_KEYS } from "../../theme";

const COLOR_SELECT = COLOR_KEYS.map(({ key, label }) => ({ label, value: key }));

const iconComponents = Object.keys(dynamicIconImports).reduce<
  Record<string, React.LazyExoticComponent<React.ComponentType<any>>>
>((acc, iconName) => {
  acc[iconName] = lazy((dynamicIconImports as any)[iconName]);
  return acc;
}, {});

const iconOptions = Object.keys(dynamicIconImports).map((iconName) => ({
  label: iconName,
  value: iconName,
}));

const FALLBACK_ICON = "circle";

const toIconKey = (icon: string) =>
  icon.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const resolveIconComponent = (icon: string | undefined) => {
  if (!icon) return iconComponents[FALLBACK_ICON];
  return (
    iconComponents[icon] ??
    iconComponents[toIconKey(icon)] ??
    iconComponents[FALLBACK_ICON]
  );
};

export type ContentIconProps = WithLayout<{
  icon: string;
  size: number;
  colorMode: "theme" | "fixed";
  colorTheme: ColorKey;
  colorFixed: string;
}>;

const ContentIconInner: ComponentConfig<ContentIconProps> = {
  label: "أيقونة",
  fields: {
    icon: { type: "select", label: "الأيقونة", options: iconOptions },
    size: { type: "number", label: "الحجم (بكسل)", min: 8, max: 128 },
    colorMode: {
      type: "radio",
      label: "اللون",
      options: [
        { label: "Theme", value: "theme" },
        { label: "Fixed", value: "fixed" },
      ],
    },
    colorTheme: { type: "select", options: COLOR_SELECT },
    colorFixed: { type: "text", label: "اللون (hex)" },
  },
  defaultProps: {
    icon: "star",
    size: 24,
    colorMode: "theme",
    colorTheme: "primary",
    colorFixed: "#2563eb",
  },
  render: ({ icon, size, colorMode, colorTheme, colorFixed }) => {
    const color =
      colorMode === "theme" ? `var(${colorVar(colorTheme)})` : colorFixed;
    const IconComponent = resolveIconComponent(icon);
    if (!IconComponent) return null;
    return (
      <span
        style={{
          display: "inline-flex",
          color,
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Suspense fallback={null}>
          <IconComponent size={size} color="currentColor" />
        </Suspense>
      </span>
    );
  },
};

export const ContentIcon = withLayout(ContentIconInner);
