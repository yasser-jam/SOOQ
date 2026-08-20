// ─── Font registry ────────────────────────────────────────────────────────────
// Each entry maps a stored key to a CSS font-family value and an optional
// Google Fonts query string so the editor can load web fonts on demand.

export type FontEntry = {
  label: string;
  value: string;
  cssValue: string;
  /** Google Fonts "family" query param, e.g. "Inter:wght@300;400;500;600;700" */
  googleFont?: string;
  /** Which locales this font supports (ar / en). Affects preview badges. */
  supportedLocales: ("ar" | "en")[];
};

/**
 * Arabic-first font registry. Latin-only faces are kept at the end for
 * bilingual storefronts but are not offered as default onboarding presets.
 */
export const FONT_OPTIONS: FontEntry[] = [
  {
    label: "خط النظام",
    value: "system",
    cssValue:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    supportedLocales: ["ar", "en"],
  },
  // ── Arabic / bilingual UI fonts ───────────────────────────────────────────
  {
    label: "Cairo",
    value: "cairo",
    cssValue: "'Cairo', sans-serif",
    googleFont: "Cairo:wght@300;400;500;600;700;800",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Tajawal",
    value: "tajawal",
    cssValue: "'Tajawal', sans-serif",
    googleFont: "Tajawal:wght@300;400;500;700;800",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Almarai",
    value: "almarai",
    cssValue: "'Almarai', sans-serif",
    googleFont: "Almarai:wght@300;400;700;800",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "IBM Plex Sans Arabic",
    value: "ibm-plex-sans-arabic",
    cssValue: "'IBM Plex Sans Arabic', sans-serif",
    googleFont: "IBM+Plex+Sans+Arabic:wght@300;400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Noto Sans Arabic",
    value: "noto-sans-arabic",
    cssValue: "'Noto Sans Arabic', sans-serif",
    googleFont: "Noto+Sans+Arabic:wght@300;400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Readex Pro",
    value: "readex-pro",
    cssValue: "'Readex Pro', sans-serif",
    googleFont: "Readex+Pro:wght@300;400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Rubik",
    value: "rubik",
    cssValue: "'Rubik', sans-serif",
    googleFont: "Rubik:wght@300;400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Changa",
    value: "changa",
    cssValue: "'Changa', sans-serif",
    googleFont: "Changa:wght@300;400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "El Messiri",
    value: "el-messiri",
    cssValue: "'El Messiri', sans-serif",
    googleFont: "El+Messiri:wght@400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Amiri",
    value: "amiri",
    cssValue: "'Amiri', serif",
    googleFont: "Amiri:ital,wght@0,400;0,700;1,400",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Noto Naskh Arabic",
    value: "noto-naskh-arabic",
    cssValue: "'Noto Naskh Arabic', serif",
    googleFont: "Noto+Naskh+Arabic:wght@400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  {
    label: "Scheherazade New",
    value: "scheherazade-new",
    cssValue: "'Scheherazade New', serif",
    googleFont: "Scheherazade+New:wght@400;500;600;700",
    supportedLocales: ["ar", "en"],
  },
  // ── Latin-only (kept for bilingual / legacy themes) ───────────────────────
  {
    label: "Inter",
    value: "inter",
    cssValue: "'Inter', sans-serif",
    googleFont: "Inter:wght@300;400;500;600;700",
    supportedLocales: ["en"],
  },
  {
    label: "Roboto",
    value: "roboto",
    cssValue: "'Roboto', sans-serif",
    googleFont: "Roboto:wght@300;400;500;700",
    supportedLocales: ["en"],
  },
  {
    label: "Open Sans",
    value: "open-sans",
    cssValue: "'Open Sans', sans-serif",
    googleFont: "Open+Sans:wght@300;400;500;600;700",
    supportedLocales: ["en"],
  },
  {
    label: "DM Sans",
    value: "dm-sans",
    cssValue: "'DM Sans', sans-serif",
    googleFont: "DM+Sans:wght@300;400;500;600;700",
    supportedLocales: ["en"],
  },
  {
    label: "Space Grotesk",
    value: "space-grotesk",
    cssValue: "'Space Grotesk', sans-serif",
    googleFont: "Space+Grotesk:wght@300;400;500;600;700",
    supportedLocales: ["en"],
  },
];

/** Font keys that include Arabic glyphs — preferred in selects / presets. */
export const ARABIC_FONT_OPTIONS = FONT_OPTIONS.filter((f) =>
  f.supportedLocales.includes("ar")
);

// ─── Theme types ──────────────────────────────────────────────────────────────

export type ThemeProps = {
  /** Font used for all body/paragraph text (applied to the page root) */
  bodyFont: string;
  /** Named font slot #1 — components can select "Primary Font" */
  fontOption1: string;
  /** Named font slot #2 — components can select "Secondary Font" */
  fontOption2: string;
};

/** Arabic-first defaults — Cairo / Tajawal / IBM Plex Sans Arabic. */
export const DEFAULT_THEME: ThemeProps = {
  bodyFont: "cairo",
  fontOption1: "tajawal",
  fontOption2: "ibm-plex-sans-arabic",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get the CSS font-family value for a stored font key */
export function getFontCssValue(fontKey: string): string {
  const fallbackFont = FONT_OPTIONS[0];
  return FONT_OPTIONS.find((f) => f.value === fontKey)?.cssValue ?? fallbackFont?.cssValue ?? fontKey;
}

/**
 * Build a Google Fonts URL that loads all requested font keys in one request.
 * Returns null when all selected fonts are system fonts.
 */
export function getGoogleFontsUrl(fontKeys: string[]): string | null {
  const families = [...new Set(fontKeys)]
    .filter((k) => k && k !== "system")
    .map((k) => FONT_OPTIONS.find((f) => f.value === k)?.googleFont)
    .filter(Boolean) as string[];

  if (families.length === 0) return null;

  return `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join("&")}&display=swap`;
}

/**
 * Inject / update a Google Fonts stylesheet on a document (editor iframe,
 * storefront, or host page for onboarding / settings previews).
 */
export function ensureGoogleFontsLoaded(
  doc: Document,
  fontKeys: string[]
): void {
  const googleFontsUrl = getGoogleFontsUrl(fontKeys);
  let linkEl = doc.getElementById("puck-theme-fonts") as HTMLLinkElement | null;

  if (!googleFontsUrl) {
    linkEl?.remove();
    doc.getElementById("puck-theme-fonts-preconnect-1")?.remove();
    doc.getElementById("puck-theme-fonts-preconnect-2")?.remove();
    return;
  }

  if (!linkEl) {
    if (!doc.getElementById("puck-theme-fonts-preconnect-1")) {
      const pre1 = doc.createElement("link");
      pre1.id = "puck-theme-fonts-preconnect-1";
      pre1.rel = "preconnect";
      pre1.href = "https://fonts.googleapis.com";
      doc.head.appendChild(pre1);
    }

    if (!doc.getElementById("puck-theme-fonts-preconnect-2")) {
      const pre2 = doc.createElement("link");
      pre2.id = "puck-theme-fonts-preconnect-2";
      pre2.rel = "preconnect";
      pre2.href = "https://fonts.gstatic.com";
      pre2.crossOrigin = "anonymous";
      doc.head.appendChild(pre2);
    }

    linkEl = doc.createElement("link");
    linkEl.id = "puck-theme-fonts";
    linkEl.rel = "stylesheet";
    doc.head.appendChild(linkEl);
  }

  if (linkEl.href !== googleFontsUrl) {
    linkEl.href = googleFontsUrl;
  }
}

/** Resolve theme font keys → CSS custom properties for editor + renderer. */
export function resolveThemeFontVars(props?: {
  bodyFont?: string;
  fontOption1?: string;
  fontOption2?: string;
}): {
  bodyFont: string;
  fontOption1: string;
  fontOption2: string;
  bodyFontCss: string;
  font1Css: string;
  font2Css: string;
  cssVars: Record<string, string>;
  dataAttrs: {
    "data-theme-body-font": string;
    "data-theme-font-1": string;
    "data-theme-font-2": string;
  };
} {
  const bodyFont = props?.bodyFont ?? DEFAULT_THEME.bodyFont;
  const fontOption1 = props?.fontOption1 ?? DEFAULT_THEME.fontOption1;
  const fontOption2 = props?.fontOption2 ?? DEFAULT_THEME.fontOption2;
  const bodyFontCss = getFontCssValue(bodyFont);
  const font1Css = getFontCssValue(fontOption1);
  const font2Css = getFontCssValue(fontOption2);

  return {
    bodyFont,
    fontOption1,
    fontOption2,
    bodyFontCss,
    font1Css,
    font2Css,
    cssVars: {
      "--theme-body-font": bodyFontCss,
      "--theme-font-1": font1Css,
      "--theme-font-2": font2Css,
    },
    dataAttrs: {
      "data-theme-body-font": bodyFont,
      "data-theme-font-1": fontOption1,
      "data-theme-font-2": fontOption2,
    },
  };
}

// ─── Component font-family field ─────────────────────────────────────────────
// Components (Heading, Text, ProductCard) reference theme CSS vars rather than
// hard-coding specific fonts so changes in Settings update the whole page.

export const COMPONENT_FONT_OPTIONS = [
  { label: "Body Font (Default)", value: "body" },
  { label: "Primary Font", value: "option1" },
  { label: "Secondary Font", value: "option2" },
];

export const COMPONENT_FONT_CSS: Record<string, string> = {
  body: "var(--theme-body-font)",
  option1: "var(--theme-font-1)",
  option2: "var(--theme-font-2)",
};

// ─── Color theme ──────────────────────────────────────────────────────────────

export type ColorKey =
  | "primary"
  | "surface"
  | "success"
  | "warning"
  | "error"
  | "dark"
  | "text"
  | "neutral";

export type ColorTheme = Record<ColorKey, string>;

export const COLOR_KEYS: { key: ColorKey; label: string; description: string }[] = [
  { key: "primary",  label: "Primary",  description: "Brand / action color" },
  { key: "surface",  label: "Surface",  description: "Card & panel backgrounds" },
  { key: "success",  label: "Success",  description: "Positive feedback" },
  { key: "warning",  label: "Warning",  description: "Caution / alerts" },
  { key: "error",    label: "Error",    description: "Destructive / danger" },
  { key: "dark",     label: "Dark",     description: "Dark backgrounds" },
  { key: "text",     label: "Text",     description: "Default body text" },
  { key: "neutral",  label: "Neutral",  description: "Borders, dividers, muted" },
];

export const DEFAULT_COLORS: ColorTheme = {
  primary: "#0b78c5",
  surface: "#f6f8fc",
  success: "#0f9d73",
  warning: "#c77a15",
  error: "#c24133",
  dark: "#10213a",
  text: "#14243f",
  neutral: "#6b7d93",
};

/** CSS custom property name for a given color key */
export function colorVar(key: ColorKey): string {
  return `--theme-color-${key}`;
}

/**
 * Derived semantic tokens used by blocks/components that need nuanced colors
 * (muted surfaces, borders, hover states) without exposing every value as a
 * top-level setting control.
 */
export function computeDerivedColorThemeVars(
  colors: ColorTheme
): Record<string, string> {
  return {
    "--theme-color-background": `color-mix(in srgb, ${colors.surface} 88%, white)`,
    "--theme-color-surface": colors.surface,
    "--theme-color-surface-elevated": `color-mix(in srgb, ${colors.surface} 78%, white)`,
    "--theme-color-border": `color-mix(in srgb, ${colors.neutral} 34%, white)`,
    "--theme-color-muted": `color-mix(in srgb, ${colors.surface} 72%, ${colors.neutral})`,
    "--theme-color-text-muted": `color-mix(in srgb, ${colors.text} 58%, white)`,
    "--theme-color-primaryMuted": `color-mix(in srgb, ${colors.primary} 15%, white)`,
    "--theme-color-primaryHover": `color-mix(in srgb, ${colors.primary} 84%, black)`,
    "--theme-color-on-primary": "#ffffff",
    "--theme-color-onPrimary": "#ffffff",
    "--theme-color-focusRing": `color-mix(in srgb, ${colors.primary} 26%, white)`,
  };
}

// ─── Badge + shell (header/footer) ───────────────────────────────────────────

export type BadgeShape = "pill" | "rounded" | "square";
export type BadgeStyle = "solid" | "outline" | "soft";

export type BadgeThemeProps = {
  badgeShape: BadgeShape;
  badgeStyle: BadgeStyle;
};

export const DEFAULT_BADGE: BadgeThemeProps = {
  badgeShape: "rounded",
  badgeStyle: "solid",
};

export type ShellVariant = "default" | "commerce";

export type ShellThemeProps = {
  headerVariant: ShellVariant;
  footerVariant: ShellVariant;
};

export const DEFAULT_SHELL: ShellThemeProps = {
  headerVariant: "commerce",
  footerVariant: "commerce",
};

// ─── Spacing scale (named spacing levels used by SpacingField) ────────────────
//
// Merchants pick a named level (ضيقة/متوسطة/واسعة) per section side instead of a
// raw px value; the level→px mapping is defined once here (and editable from the
// settings panel) so the whole store keeps one consistent spacing rhythm.
// Values are stored in block props as plain px strings — changing the scale only
// affects how the SpacingField labels an existing value, never saved data.

export type SpacingScaleProps = {
  /** Vertical rhythm (section top/bottom padding) */
  spacingVerticalNarrow: string;
  spacingVerticalMedium: string;
  spacingVerticalWide: string;
  /** Horizontal rhythm (side padding, grid gaps) */
  spacingSideNarrow: string;
  spacingSideMedium: string;
  spacingSideWide: string;
};

export const DEFAULT_SPACING_SCALE: SpacingScaleProps = {
  spacingVerticalNarrow: "24px",
  spacingVerticalMedium: "48px",
  spacingVerticalWide: "80px",
  spacingSideNarrow: "12px",
  spacingSideMedium: "24px",
  spacingSideWide: "48px",
};

// ─── Responsive breakpoints (layout visibility per viewport) ─────────────────

export type BreakpointThemeProps = {
  /** Inclusive max width (px) for “mobile”; ≤ this matches mobile rules */
  breakpointMobileMax: number;
  /** Inclusive max width (px) for “tablet”; between mobile+1 and this = tablet */
  breakpointTabletMax: number;
};

export const DEFAULT_BREAKPOINTS: BreakpointThemeProps = {
  breakpointMobileMax: 767,
  breakpointTabletMax: 1023,
};

/** Clamp breakpoint values so tablet range is non-empty. */
export function normalizeBreakpoints(
  input?: Partial<BreakpointThemeProps>
): BreakpointThemeProps {
  // Callers pass `{ breakpointMobileMax: rootProps?.breakpointMobileMax, ... }`,
  // which is `undefined` whenever the merchant hasn't customized breakpoints —
  // a plain `{...DEFAULT_BREAKPOINTS, ...input}` spread would let that explicit
  // `undefined` clobber the default (Math.round(undefined) → NaN → every
  // viewport bucket resolves to "desktop"), so fall back per-field instead.
  const base = {
    breakpointMobileMax:
      input?.breakpointMobileMax ?? DEFAULT_BREAKPOINTS.breakpointMobileMax,
    breakpointTabletMax:
      input?.breakpointTabletMax ?? DEFAULT_BREAKPOINTS.breakpointTabletMax,
  };
  let mobile = Math.max(320, Math.min(2000, Math.round(base.breakpointMobileMax)));
  let tablet = Math.max(mobile + 1, Math.min(2400, Math.round(base.breakpointTabletMax)));
  return { breakpointMobileMax: mobile, breakpointTabletMax: tablet };
}

export type ViewportBucket = "mobile" | "tablet" | "desktop";

export function getViewportBucket(
  widthPx: number,
  bp: BreakpointThemeProps
): ViewportBucket {
  if (widthPx <= bp.breakpointMobileMax) return "mobile";
  if (widthPx <= bp.breakpointTabletMax) return "tablet";
  return "desktop";
}

/**
 * CSS for per-breakpoint visibility (see Layout `data-puck-hide-*`).
 * Editor canvas also hides via Layout JS using the active viewport bucket.
 */
export function buildResponsiveLayoutCss(bp: BreakpointThemeProps): string {
  const { breakpointMobileMax: m, breakpointTabletMax: t } = normalizeBreakpoints(bp);
  const tabletMin = m + 1;
  const desktopMin = t + 1;
  return `
@media (max-width: ${m}px) {
  [data-puck-hide-mobile="true"] {
    display: none !important;
  }
}
@media (min-width: ${tabletMin}px) and (max-width: ${t}px) {
  [data-puck-hide-tablet="true"] {
    display: none !important;
  }
}
@media (min-width: ${desktopMin}px) {
  [data-puck-hide-desktop="true"] {
    display: none !important;
  }
}
`;
}

/** Parse `--theme-bp-mobile-max` from the document (set by ThemeInjector). */
export function readMobileBreakpointPx(fallback = 767): number {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--theme-bp-mobile-max")
    .trim()
    .replace(/px$/, "");
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse Puck canvas viewport width (number, "360px", or "100%") to a pixel width for bucket checks. */
export function parseViewportWidthForBucket(
  w: string | number | undefined
): number {
  if (w == null) return DEFAULT_BREAKPOINTS.breakpointTabletMax + 1;
  if (typeof w === "number" && Number.isFinite(w)) return w;
  const s = String(w).trim();
  if (s === "100%" || s === "auto") return 1440;
  const match = s.match(/^(\d+)/);
  const width = match?.[1];
  return width ? parseInt(width, 10) : DEFAULT_BREAKPOINTS.breakpointTabletMax + 1;
}

/** CSS vars for product badges (discount / stock), driven by Settings */
export function computeBadgeThemeVars(
  shape: BadgeShape,
  style: BadgeStyle,
  errorHex: string,
  successHex: string,
  neutralHex: string
): Record<string, string> {
  const radius =
    shape === "pill" ? "9999px" : shape === "square" ? "2px" : "8px";

  const padX = shape === "pill" ? "12px" : "10px";
  const padY = "4px";

  const solid = (bg: string, fg: string, border: string) => ({
    bg,
    fg,
    border,
  });

  const forTone = (main: string, _muted: string) => {
    if (style === "outline") {
      return solid("transparent", main, `1px solid ${main}`);
    }
    if (style === "soft") {
      return solid(
        `color-mix(in srgb, ${main} 20%, white)`,
        main,
        "none"
      );
    }
    return solid(main, "#ffffff", "none");
  };

  const d = forTone(errorHex, errorHex);
  const s = forTone(successHex, successHex);
  const o = forTone(neutralHex, neutralHex);

  return {
    "--theme-badge-radius": radius,
    "--theme-badge-padding-x": padX,
    "--theme-badge-padding-y": padY,
    "--theme-badge-font-size": "11px",
    "--theme-badge-font-weight": "600",
    "--theme-badge-discount-bg": d.bg,
    "--theme-badge-discount-fg": d.fg,
    "--theme-badge-discount-border": d.border,
    "--theme-badge-stock-bg": s.bg,
    "--theme-badge-stock-fg": s.fg,
    "--theme-badge-stock-border": s.border,
    "--theme-badge-out-bg": o.bg,
    "--theme-badge-out-fg": o.fg,
    "--theme-badge-out-border": o.border,
  };
}

export function getThemeRootClassNames(
  badgeStyle: BadgeStyle,
  badgeShape: BadgeShape
): string {
  return ["theme-root", `theme-badge-style-${badgeStyle}`, `theme-badge-shape-${badgeShape}`].join(
    " "
  );
}

// ─── Typography / radius / button scales (content blocks) ─────────────────────

export type TextSizeStep = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export type ScaleThemeProps = {
  textSizeXs: string;
  textSizeSm: string;
  textSizeMd: string;
  textSizeLg: string;
  textSizeXl: string;
  textSize2xl: string;
  radiusNone: string;
  radiusSm: string;
  radiusMd: string;
  radiusLg: string;
  radiusXl: string;
  radiusFull: string;
  buttonSmHeight: string;
  buttonSmPaddingX: string;
  buttonSmPaddingY: string;
  buttonSmFontSize: string;
  buttonMdHeight: string;
  buttonMdPaddingX: string;
  buttonMdPaddingY: string;
  buttonMdFontSize: string;
  buttonLgHeight: string;
  buttonLgPaddingX: string;
  buttonLgPaddingY: string;
  buttonLgFontSize: string;
  fontWeightLight: string;
  fontWeightNormal: string;
  fontWeightMedium: string;
  fontWeightSemibold: string;
  fontWeightBold: string;
  fontWeightBolder: string;
  lineHeightTight: string;
  lineHeightNormal: string;
  lineHeightRelaxed: string;
};

export const DEFAULT_SCALES: ScaleThemeProps = {
  textSizeXs: "0.75rem",
  textSizeSm: "0.875rem",
  textSizeMd: "1rem",
  textSizeLg: "1.1875rem",
  textSizeXl: "1.375rem",
  textSize2xl: "1.75rem",
  radiusNone: "0",
  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "18px",
  radiusXl: "24px",
  radiusFull: "9999px",
  buttonSmHeight: "34px",
  buttonSmPaddingX: "14px",
  buttonSmPaddingY: "6px",
  buttonSmFontSize: "0.875rem",
  buttonMdHeight: "44px",
  buttonMdPaddingX: "18px",
  buttonMdPaddingY: "9px",
  buttonMdFontSize: "1rem",
  buttonLgHeight: "54px",
  buttonLgPaddingX: "26px",
  buttonLgPaddingY: "12px",
  buttonLgFontSize: "1.0625rem",
  fontWeightLight: "400",
  fontWeightNormal: "500",
  fontWeightMedium: "600",
  fontWeightSemibold: "700",
  fontWeightBold: "900",
  fontWeightBolder: "900",
  lineHeightTight: "1.22",
  lineHeightNormal: "1.58",
  lineHeightRelaxed: "1.78",
};

/** CSS var for a theme text size step */
export function textSizeVar(step: TextSizeStep): string {
  const map: Record<TextSizeStep, string> = {
    xs: "var(--theme-text-size-xs)",
    sm: "var(--theme-text-size-sm)",
    md: "var(--theme-text-size-md)",
    lg: "var(--theme-text-size-lg)",
    xl: "var(--theme-text-size-xl)",
    "2xl": "var(--theme-text-size-2xl)",
  };
  return map[step];
}

export type RadiusStep = "none" | "sm" | "md" | "lg" | "xl" | "full";

export function radiusVar(step: RadiusStep): string {
  const map: Record<RadiusStep, string> = {
    none: "var(--theme-radius-none)",
    sm: "var(--theme-radius-sm)",
    md: "var(--theme-radius-md)",
    lg: "var(--theme-radius-lg)",
    xl: "var(--theme-radius-xl)",
    full: "var(--theme-radius-full)",
  };
  return map[step];
}

export type FontWeightStep = "light" | "normal" | "medium" | "semibold" | "bold" | "bolder";

export type LineHeightStep = "tight" | "normal" | "relaxed";

export function lineHeightVar(step: LineHeightStep): string {
  const map: Record<LineHeightStep, string> = {
    tight: "var(--theme-line-height-tight)",
    normal: "var(--theme-line-height-normal)",
    relaxed: "var(--theme-line-height-relaxed)",
  };
  return map[step];
}

export function fontWeightVar(step: FontWeightStep): string {
  const map: Record<FontWeightStep, string> = {
    light: "var(--theme-font-weight-light)",
    normal: "var(--theme-font-weight-normal)",
    medium: "var(--theme-font-weight-medium)",
    semibold: "var(--theme-font-weight-semibold)",
    bold: "var(--theme-font-weight-bold)",
    bolder: "var(--theme-font-weight-bolder)",
  };
  return map[step];
}

export type ButtonSizeStep = "sm" | "md" | "lg";

/** Returns CSS for height, padding, font-size from theme button scale */
export function buttonSizeVars(step: ButtonSizeStep): {
  height: string;
  paddingLeft: string;
  paddingRight: string;
  paddingTop: string;
  paddingBottom: string;
  fontSize: string;
} {
  const map: Record<
    ButtonSizeStep,
    {
      height: string;
      pl: string;
      pr: string;
      pt: string;
      pb: string;
      fs: string;
    }
  > = {
    sm: {
      height: "var(--theme-button-sm-height)",
      pl: "var(--theme-button-sm-padding-x)",
      pr: "var(--theme-button-sm-padding-x)",
      pt: "var(--theme-button-sm-padding-y)",
      pb: "var(--theme-button-sm-padding-y)",
      fs: "var(--theme-button-sm-font-size)",
    },
    md: {
      height: "var(--theme-button-md-height)",
      pl: "var(--theme-button-md-padding-x)",
      pr: "var(--theme-button-md-padding-x)",
      pt: "var(--theme-button-md-padding-y)",
      pb: "var(--theme-button-md-padding-y)",
      fs: "var(--theme-button-md-font-size)",
    },
    lg: {
      height: "var(--theme-button-lg-height)",
      pl: "var(--theme-button-lg-padding-x)",
      pr: "var(--theme-button-lg-padding-x)",
      pt: "var(--theme-button-lg-padding-y)",
      pb: "var(--theme-button-lg-padding-y)",
      fs: "var(--theme-button-lg-font-size)",
    },
  };
  const m = map[step];
  return {
    height: m.height,
    paddingLeft: m.pl,
    paddingRight: m.pr,
    paddingTop: m.pt,
    paddingBottom: m.pb,
    fontSize: m.fs,
  };
}

/** Build :root scale lines for ThemeInjector / server */
export function computeScaleThemeVars(scales: Partial<ScaleThemeProps> | undefined): Record<string, string> {
  const s = { ...DEFAULT_SCALES, ...scales };
  return {
    "--theme-text-size-xs": s.textSizeXs,
    "--theme-text-size-sm": s.textSizeSm,
    "--theme-text-size-md": s.textSizeMd,
    "--theme-text-size-lg": s.textSizeLg,
    "--theme-text-size-xl": s.textSizeXl,
    "--theme-text-size-2xl": s.textSize2xl,
    "--theme-radius-none": s.radiusNone,
    "--theme-radius-sm": s.radiusSm,
    "--theme-radius-md": s.radiusMd,
    "--theme-radius-lg": s.radiusLg,
    "--theme-radius-xl": s.radiusXl,
    "--theme-radius-full": s.radiusFull,
    "--theme-button-sm-height": s.buttonSmHeight,
    "--theme-button-sm-padding-x": s.buttonSmPaddingX,
    "--theme-button-sm-padding-y": s.buttonSmPaddingY,
    "--theme-button-sm-font-size": s.buttonSmFontSize,
    "--theme-button-md-height": s.buttonMdHeight,
    "--theme-button-md-padding-x": s.buttonMdPaddingX,
    "--theme-button-md-padding-y": s.buttonMdPaddingY,
    "--theme-button-md-font-size": s.buttonMdFontSize,
    "--theme-button-lg-height": s.buttonLgHeight,
    "--theme-button-lg-padding-x": s.buttonLgPaddingX,
    "--theme-button-lg-padding-y": s.buttonLgPaddingY,
    "--theme-button-lg-font-size": s.buttonLgFontSize,
    "--theme-font-weight-light": s.fontWeightLight,
    "--theme-font-weight-normal": s.fontWeightNormal,
    "--theme-font-weight-medium": s.fontWeightMedium,
    "--theme-font-weight-semibold": s.fontWeightSemibold,
    "--theme-font-weight-bold": s.fontWeightBold,
    "--theme-font-weight-bolder": s.fontWeightBolder,
    "--theme-line-height-tight": s.lineHeightTight,
    "--theme-line-height-normal": s.lineHeightNormal,
    "--theme-line-height-relaxed": s.lineHeightRelaxed,
  };
}

// ─── Button variant theme ─────────────────────────────────────────────────────

export type ButtonVariantKey = "primary" | "secondary" | "error";

export type ButtonVariantThemeProps = {
  buttonVariantPrimaryBg?: string;
  buttonVariantPrimaryFg?: string;
  buttonVariantPrimaryRadius?: string;
  buttonVariantPrimarySize?: string;
  buttonVariantSecondaryBg?: string;
  buttonVariantSecondaryFg?: string;
  buttonVariantSecondaryRadius?: string;
  buttonVariantSecondarySize?: string;
  buttonVariantErrorBg?: string;
  buttonVariantErrorFg?: string;
  buttonVariantErrorRadius?: string;
  buttonVariantErrorSize?: string;
};

export const DEFAULT_BUTTON_VARIANTS: Record<
  ButtonVariantKey,
  { bg: string; fg: string; radius: string; size: string }
> = {
  primary: { bg: "#0b78c5", fg: "#ffffff", radius: "8px", size: "md" },
  secondary: { bg: "#64748b", fg: "#ffffff", radius: "8px", size: "md" },
  error: { bg: "#c24133", fg: "#ffffff", radius: "8px", size: "md" },
};

/** CSS custom properties for ContentButton variant mode (editor + live). */
export function computeButtonVariantThemeVars(
  props?: Partial<ButtonVariantThemeProps>
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of ["primary", "secondary", "error"] as ButtonVariantKey[]) {
    const cap = key.charAt(0).toUpperCase() + key.slice(1);
    const defaults = DEFAULT_BUTTON_VARIANTS[key];
    vars[`--theme-button-variant-${key}-bg`] =
      props?.[`buttonVariant${cap}Bg` as keyof ButtonVariantThemeProps] ??
      defaults.bg;
    vars[`--theme-button-variant-${key}-fg`] =
      props?.[`buttonVariant${cap}Fg` as keyof ButtonVariantThemeProps] ??
      defaults.fg;
    vars[`--theme-button-variant-${key}-radius`] =
      props?.[`buttonVariant${cap}Radius` as keyof ButtonVariantThemeProps] ??
      defaults.radius;
    vars[`--theme-button-variant-${key}-size`] =
      props?.[`buttonVariant${cap}Size` as keyof ButtonVariantThemeProps] ??
      defaults.size;
  }
  return vars;
}

// ─── Combined theme shape ─────────────────────────────────────────────────────
// A single root.props object carries fonts, colours, badge + shell options.

export type FullThemeProps = ThemeProps &
  Partial<ColorTheme> &
  Partial<BadgeThemeProps> &
  Partial<ShellThemeProps> &
  Partial<ScaleThemeProps> &
  Partial<BreakpointThemeProps> &
  Partial<SpacingScaleProps> &
  Partial<ButtonVariantThemeProps>;
