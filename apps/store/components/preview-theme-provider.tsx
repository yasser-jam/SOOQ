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
  DEFAULT_THEME,
  getFontCssValue,
  getGoogleFontsUrl,
  normalizeBreakpoints,
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
  const bodyFont = (rootProps?.bodyFont ?? DEFAULT_THEME.bodyFont) as string;
  const fontOption1 = (rootProps?.fontOption1 ??
    DEFAULT_THEME.fontOption1) as string;
  const fontOption2 = (rootProps?.fontOption2 ??
    DEFAULT_THEME.fontOption2) as string;

  const bodyFontCss = getFontCssValue(bodyFont);
  const font1Css = getFontCssValue(fontOption1);
  const font2Css = getFontCssValue(fontOption2);
  const googleFontsUrl = getGoogleFontsUrl([bodyFont, fontOption1, fontOption2]);

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

    styleEl.textContent = `
      :root {
        --theme-body-font: ${bodyFontCss};
        --theme-font-1: ${font1Css};
        --theme-font-2: ${font2Css};
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

    let responsiveEl = doc.getElementById(
      "puck-responsive-layout"
    ) as HTMLStyleElement | null;
    if (!responsiveEl) {
      responsiveEl = doc.createElement("style");
      responsiveEl.id = "puck-responsive-layout";
      doc.head.appendChild(responsiveEl);
    }
    responsiveEl.textContent = responsiveLayoutCss;

    let linkEl = doc.getElementById("puck-theme-fonts") as HTMLLinkElement | null;
    if (googleFontsUrl) {
      if (!linkEl) {
        const pre1 = doc.createElement("link");
        pre1.id = "puck-theme-fonts-preconnect-1";
        pre1.rel = "preconnect";
        pre1.href = "https://fonts.googleapis.com";
        doc.head.appendChild(pre1);

        const pre2 = doc.createElement("link");
        pre2.id = "puck-theme-fonts-preconnect-2";
        pre2.rel = "preconnect";
        pre2.href = "https://fonts.gstatic.com";
        pre2.crossOrigin = "anonymous";
        doc.head.appendChild(pre2);

        linkEl = doc.createElement("link");
        linkEl.id = "puck-theme-fonts";
        linkEl.rel = "stylesheet";
        doc.head.appendChild(linkEl);
      }
      if (linkEl.href !== googleFontsUrl) {
        linkEl.href = googleFontsUrl;
      }
    }
  }, [
    badgeVars,
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
    googleFontsUrl,
    responsiveLayoutCss,
    scaleVars,
    bp.breakpointMobileMax,
    bp.breakpointTabletMax,
  ]);

  return <>{children}</>;
}
