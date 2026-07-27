"use client";

import { ReactNode, useLayoutEffect } from "react";
import {
  buildResponsiveLayoutCss,
  COLOR_KEYS,
  colorVar,
  computeBadgeThemeVars,
  computeButtonVariantThemeVars,
  computeDerivedColorThemeVars,
  computeScaleThemeVars,
  DEFAULT_BADGE,
  DEFAULT_COLORS,
  ensureGoogleFontsLoaded,
  normalizeBreakpoints,
  resolveThemeFontVars,
  type BadgeShape,
  type BadgeStyle,
  type ColorTheme,
  type FullThemeProps,
} from "@/core/config/theme";

type PreviewThemeProviderProps = {
  rootProps?: Partial<FullThemeProps>;
  children: ReactNode;
};

export function PreviewThemeProvider({
  rootProps,
  children,
}: PreviewThemeProviderProps) {
  const fonts = resolveThemeFontVars(rootProps);
  const { bodyFont, fontOption1, fontOption2, bodyFontCss, font1Css, font2Css } =
    fonts;

  const colors: ColorTheme = {
    primary: rootProps?.primary ?? DEFAULT_COLORS.primary,
    surface: rootProps?.surface ?? DEFAULT_COLORS.surface,
    success: rootProps?.success ?? DEFAULT_COLORS.success,
    warning: rootProps?.warning ?? DEFAULT_COLORS.warning,
    error: rootProps?.error ?? DEFAULT_COLORS.error,
    dark: rootProps?.dark ?? DEFAULT_COLORS.dark,
    text: rootProps?.text ?? DEFAULT_COLORS.text,
    neutral: rootProps?.neutral ?? DEFAULT_COLORS.neutral,
  };

  const badgeShape = (rootProps?.badgeShape ??
    DEFAULT_BADGE.badgeShape) as BadgeShape;
  const badgeStyle = (rootProps?.badgeStyle ??
    DEFAULT_BADGE.badgeStyle) as BadgeStyle;
  const badgeVars = computeBadgeThemeVars(
    badgeShape,
    badgeStyle,
    colors.error,
    colors.success,
    colors.neutral
  );
  const derivedColorVars = computeDerivedColorThemeVars(colors);
  const scaleVars = computeScaleThemeVars(rootProps);
  const buttonVariantVars = computeButtonVariantThemeVars(
    rootProps as Partial<FullThemeProps>
  );
  const bp = normalizeBreakpoints({
    breakpointMobileMax: rootProps?.breakpointMobileMax,
    breakpointTabletMax: rootProps?.breakpointTabletMax,
  });
  const responsiveLayoutCss = buildResponsiveLayoutCss(bp);

  useLayoutEffect(() => {
    const doc = document;

    let styleEl = doc.getElementById("puck-theme-vars") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "puck-theme-vars";
      doc.head.appendChild(styleEl);
    }

    const colorVarLines = COLOR_KEYS.map(
      ({ key }) => `        ${colorVar(key)}: ${colors[key]};`
    ).join("\n");
    const badgeVarLines = Object.entries(badgeVars)
      .map(([k, v]) => `        ${k}: ${v};`)
      .join("\n");
    const derivedColorVarLines = Object.entries(derivedColorVars)
      .map(([k, v]) => `        ${k}: ${v};`)
      .join("\n");
    const scaleVarLines = Object.entries(scaleVars)
      .map(([k, v]) => `        ${k}: ${v};`)
      .join("\n");
    const buttonVariantVarLines = Object.entries(buttonVariantVars)
      .map(([k, v]) => `        ${k}: ${v};`)
      .join("\n");
    const fontVarLines = `
        --theme-body-font: ${bodyFontCss};
        --theme-font-1: ${font1Css};
        --theme-font-2: ${font2Css};`;

    styleEl.textContent = `
      :root {
${fontVarLines}
${colorVarLines}
${derivedColorVarLines}
${badgeVarLines}
${scaleVarLines}
${buttonVariantVarLines}
        --theme-bp-mobile-max: ${bp.breakpointMobileMax}px;
        --theme-bp-tablet-max: ${bp.breakpointTabletMax}px;
      }
      html {
        scroll-behavior: smooth;
      }
      body {
        font-family: var(--theme-body-font);
        color: var(--theme-color-text);
        background: var(--theme-color-background);
        margin: 0;
      }
    `;

    const html = doc.documentElement;
    html.setAttribute("data-theme-body-font", bodyFont);
    html.setAttribute("data-theme-font-1", fontOption1);
    html.setAttribute("data-theme-font-2", fontOption2);

    let responsiveEl = doc.getElementById(
      "puck-responsive-layout"
    ) as HTMLStyleElement | null;
    if (!responsiveEl) {
      responsiveEl = doc.createElement("style");
      responsiveEl.id = "puck-responsive-layout";
      doc.head.appendChild(responsiveEl);
    }
    responsiveEl.textContent = responsiveLayoutCss;

    ensureGoogleFontsLoaded(doc, [bodyFont, fontOption1, fontOption2]);
  }, [
    badgeVars,
    bodyFont,
    bodyFontCss,
    buttonVariantVars,
    colors.dark,
    colors.error,
    colors.neutral,
    colors.primary,
    colors.success,
    colors.surface,
    colors.text,
    colors.warning,
    derivedColorVars,
    font1Css,
    font2Css,
    fontOption1,
    fontOption2,
    responsiveLayoutCss,
    scaleVars,
    bp.breakpointMobileMax,
    bp.breakpointTabletMax,
  ]);

  return <>{children}</>;
}
