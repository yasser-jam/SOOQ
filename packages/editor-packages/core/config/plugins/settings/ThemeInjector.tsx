"use client";
import React, { ReactNode, useLayoutEffect } from "react";
import { useAppStore } from "@/core/store";
import {
  getFontCssValue,
  getGoogleFontsUrl,
  DEFAULT_THEME,
  COLOR_KEYS,
  ColorTheme,
  DEFAULT_COLORS,
  DEFAULT_BADGE,
  FullThemeProps,
  colorVar,
  computeBadgeThemeVars,
  computeDerivedColorThemeVars,
  computeScaleThemeVars,
  computeButtonVariantThemeVars,
  buildResponsiveLayoutCss,
  normalizeBreakpoints,
  type BadgeShape,
  type BadgeStyle,
} from "../../theme";

interface ThemeInjectorProps {
  children: ReactNode;
  document?: Document;
}

/**
 * Renders inside `overrides.iframe` — injects CSS custom-property theme tokens
 * (fonts AND colors) plus Google Fonts link tags directly into the preview
 * iframe's <head>. Runs reactively whenever theme settings change.
 */
export function ThemeInjector({ children, document: iframeDoc }: ThemeInjectorProps) {
  const rootProps = useAppStore(
    (s) => s.state.data.root.props as Partial<FullThemeProps> | undefined
  );

  // ── Font values ──
  const bodyFont = (rootProps?.bodyFont ?? DEFAULT_THEME.bodyFont) as string;
  const fontOption1 = (rootProps?.fontOption1 ?? DEFAULT_THEME.fontOption1) as string;
  const fontOption2 = (rootProps?.fontOption2 ?? DEFAULT_THEME.fontOption2) as string;

  const bodyFontCss = getFontCssValue(bodyFont);
  const font1Css = getFontCssValue(fontOption1);
  const font2Css = getFontCssValue(fontOption2);
  const googleFontsUrl = getGoogleFontsUrl([bodyFont, fontOption1, fontOption2]);

  // ── Color values ──
  const colors: ColorTheme = {
    primary: rootProps?.primary ?? DEFAULT_COLORS.primary,
    surface: rootProps?.surface ?? DEFAULT_COLORS.surface,
    success: rootProps?.success ?? DEFAULT_COLORS.success,
    warning: rootProps?.warning ?? DEFAULT_COLORS.warning,
    error:   rootProps?.error   ?? DEFAULT_COLORS.error,
    dark:    rootProps?.dark    ?? DEFAULT_COLORS.dark,
    text:    rootProps?.text    ?? DEFAULT_COLORS.text,
    neutral: rootProps?.neutral ?? DEFAULT_COLORS.neutral,
  };

  const badgeShape = (rootProps?.badgeShape ?? DEFAULT_BADGE.badgeShape) as BadgeShape;
  const badgeStyle = (rootProps?.badgeStyle ?? DEFAULT_BADGE.badgeStyle) as BadgeStyle;
  const badgeVars = computeBadgeThemeVars(
    badgeShape,
    badgeStyle,
    colors.error,
    colors.success,
    colors.neutral
  );
  const derivedColorVars = computeDerivedColorThemeVars(colors);

  const badgeVarLines = Object.entries(badgeVars)
    .map(([k, v]) => `        ${k}: ${v};`)
    .join("\n");

  const derivedColorVarLines = Object.entries(derivedColorVars)
    .map(([k, v]) => `        ${k}: ${v};`)
    .join("\n");

  const scaleVars = computeScaleThemeVars(rootProps);
  const scaleVarLines = Object.entries(scaleVars)
    .map(([k, v]) => `        ${k}: ${v};`)
    .join("\n");

  const buttonVariantVars = computeButtonVariantThemeVars(
    rootProps as Partial<FullThemeProps>
  );
  const buttonVariantVarLines = Object.entries(buttonVariantVars)
    .map(([k, v]) => `        ${k}: ${v};`)
    .join("\n");

  const bp = normalizeBreakpoints({
    breakpointMobileMax: rootProps?.breakpointMobileMax,
    breakpointTabletMax: rootProps?.breakpointTabletMax,
  });
  const responsiveLayoutCss = buildResponsiveLayoutCss(bp);
  const bpMobile = bp.breakpointMobileMax;
  const bpTablet = bp.breakpointTabletMax;

  // ── Static rules: written once per iframe document. Theme *values* are
  // applied as inline custom properties on <html> (see next effect), so this
  // sheet never needs re-parsing when the merchant tweaks a color.
  useLayoutEffect(() => {
    const doc = iframeDoc;
    if (!doc) return;

    let styleEl = doc.getElementById("puck-theme-vars") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = doc.createElement("style");
      styleEl.id = "puck-theme-vars";
      doc.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /*
       * Preview-iframe scroll fix.
       * Tailwind v4 preflight (copied into the iframe via CopyHostStyles) can set
       * html/body { height: 100% } which pins the scroll container to the iframe
       * viewport height and makes content below the fold unreachable.
       * Override those constraints so the native iframe viewport scroll works.
       */
      html {
        height: auto !important;
        min-height: 100% !important;
        overflow-x: hidden !important;
        overflow-y: auto !important;
        scroll-behavior: smooth;
      }
      body {
        height: auto !important;
        min-height: 0 !important;
        overflow-x: hidden !important;
        overflow-y: visible !important;
        font-family: var(--theme-body-font);
        color: var(--theme-color-text);
        background: var(--theme-color-background);
        margin: 0;
      }
    `;
  }, [iframeDoc]);

  useLayoutEffect(() => {
    const doc = iframeDoc;
    if (!doc) return;

    // ── Update CSS custom properties in place ──
    // setProperty on the root element avoids rewriting (and re-parsing) a
    // whole <style> sheet on every color/scale tweak — the previous approach
    // re-parsed a ~120-line sheet per keystroke in the settings panel.
    const rootStyle = doc.documentElement.style;
    const setVars = (vars: Record<string, string>) => {
      for (const [key, value] of Object.entries(vars)) {
        rootStyle.setProperty(key, value);
      }
    };

    rootStyle.setProperty("--theme-body-font", bodyFontCss);
    rootStyle.setProperty("--theme-font-1", font1Css);
    rootStyle.setProperty("--theme-font-2", font2Css);

    COLOR_KEYS.forEach(({ key }) => {
      rootStyle.setProperty(colorVar(key), colors[key]);
    });

    setVars(derivedColorVars);
    setVars(badgeVars);
    setVars(scaleVars);
    setVars(buttonVariantVars);

    rootStyle.setProperty("--theme-bp-mobile-max", `${bpMobile}px`);
    rootStyle.setProperty("--theme-bp-tablet-max", `${bpTablet}px`);

    // ── Inject / update Google Fonts link ──
    let linkEl = doc.getElementById("puck-theme-fonts") as HTMLLinkElement | null;
    let responsiveEl = doc.getElementById("puck-responsive-layout") as HTMLStyleElement | null;
    if (!responsiveEl) {
      responsiveEl = doc.createElement("style");
      responsiveEl.id = "puck-responsive-layout";
      doc.head.appendChild(responsiveEl);
    }
    responsiveEl.textContent = responsiveLayoutCss;

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
        (pre2 as any).crossOrigin = "anonymous";
        doc.head.appendChild(pre2);

        linkEl = doc.createElement("link");
        linkEl.id = "puck-theme-fonts";
        linkEl.rel = "stylesheet";
        doc.head.appendChild(linkEl);
      }
      if (linkEl.href !== googleFontsUrl) {
        linkEl.href = googleFontsUrl;
      }
    } else {
      doc.getElementById("puck-theme-fonts")?.remove();
      doc.getElementById("puck-theme-fonts-preconnect-1")?.remove();
      doc.getElementById("puck-theme-fonts-preconnect-2")?.remove();
    }
  }, [
    iframeDoc,
    bodyFontCss,
    font1Css,
    font2Css,
    googleFontsUrl,
    derivedColorVarLines,
    badgeVarLines,
    // spread colors into deps
    colors.primary,
    colors.surface,
    colors.success,
    colors.warning,
    colors.error,
    colors.dark,
    colors.text,
    colors.neutral,
    scaleVarLines,
    responsiveLayoutCss,
    bpMobile,
    bpTablet,
    buttonVariantVarLines,
  ]);

  return <>{children}</>;
}
