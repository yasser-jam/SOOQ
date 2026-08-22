"use client";

import React, { CSSProperties } from "react";
import {
  Type,
} from "lucide-react";
import { DefaultRootRenderProps, RootConfig } from "@/core";
import { sectionHeader } from "./fields/SectionHeader";
import {
  DEFAULT_HEADER_LINKS,
  type HeaderLink,
  type HeaderDrawerIcon,
} from "./components/Header";
import {
  DEFAULT_FOOTER_COLUMNS,
  type FooterColumn,
} from "./components/Footer";
import {
  DEFAULT_DRAWER_LINKS,
  type SiteDrawerLink,
  type SiteDrawerSide,
  type SiteDrawerAnimation,
  type SiteDrawerIcon,
  type SiteDrawerTrigger,
} from "./components/SiteDrawer";
import {
  resolveThemeFontVars,
  DEFAULT_THEME,
  COLOR_KEYS,
  ColorTheme,
  DEFAULT_COLORS,
  FullThemeProps,
  colorVar,
  DEFAULT_BADGE,
  DEFAULT_SHELL,
  DEFAULT_SCALES,
  DEFAULT_BREAKPOINTS,
  buildResponsiveLayoutCss,
  normalizeBreakpoints,
  computeBadgeThemeVars,
  computeDerivedColorThemeVars,
  computeScaleThemeVars,
  computeButtonVariantThemeVars,
  getThemeRootClassNames,
  type BadgeShape,
  type BadgeStyle,
} from "./theme";
import {
  ZONE_HEADER,
  ZONE_FOOTER,
  ZONE_DRAWER,
  ZONE_POPUP,
  ZONE_BOTTOM_SHEET,
} from "./shell-zones";
import { isMobileEditorMetadata } from "./lib/editor-mode";
import { useActiveLanguage } from "./locale/LanguageContext";
import { LanguageProvider } from "./locale/LanguageProvider";
import {
  bilingualTextField,
  type BilingualString,
} from "./fields/BilingualText";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Locale & writing direction.
 * SOOQ defaults to Arabic-first / RTL per SRS DSN-001 (Arabic default).
 */
export type LocaleProps = {
  /** Page direction. Defaults to "rtl" (Arabic-first). DSN-001. */
  direction?: "rtl" | "ltr";
  /** Page language code (BCP-47). Defaults to "ar" (Arabic). */
  language?: "ar" | "en";
  /** Display currency. Defaults to SYP (Syrian Pound). DSN-010 / CUR module. */
  currency?: "SYP" | "USD" | "EUR";
};

export type RootProps = DefaultRootRenderProps<
  Partial<FullThemeProps> &
    LocaleProps & {
      title?: BilingualString | string;
      /**
       * Page-scoped, injected by `composePuckData` from `SitePage.fullScreen`
       * (never persisted on the site root). Splash/onboarding pages live
       * outside the shell, so the header and footer zones are not rendered.
       */
      pageFullScreen?: boolean;
      /** When true, the HTML block appears in the Content palette (Settings → Editor). */
      enableHtmlRichTextBlock?: boolean;

      // ─── Shell: site header ─────────────────────────────────────────────────
      /** When false, the site-wide header band is hidden on every page. */
      headerVisible?: boolean;
      /** Where clicking the brand/logo takes the customer. Defaults to "/". */
      headerBrandHref?: string;
      /** Optional header brand text override. Empty string hides it. */
      headerBrandTitle?: string;
      /** Editable header nav items (bilingual). Shared across all pages. */
      headerLinks?: HeaderLink[];
      /** Optional header colour overrides. Empty = theme defaults. */
      headerBackgroundColor?: string;
      headerTextColor?: string;
      /** Show a hamburger-style button on the header that toggles the drawer. */
      headerShowDrawerButton?: boolean;
      headerDrawerButtonIcon?: HeaderDrawerIcon;

      // ─── Shell: site footer ─────────────────────────────────────────────────
      /** When false, the site-wide footer band is hidden on every page. */
      footerVisible?: boolean;
      /** Short tagline beside the brand in the footer. */
      footerTagline?: string;
      /** Arabic tagline (falls back to EN when empty). */
      footerTaglineAr?: string;
      /** Optional footer brand text override. Empty string hides it. */
      footerBrandTitle?: string;
      /** Editable footer link columns (bilingual). */
      footerColumns?: FooterColumn[];
      /** Optional footer colour overrides. Empty = theme defaults. */
      footerBackgroundColor?: string;
      footerTextColor?: string;

      // ─── Shell: site drawer (side panel) ────────────────────────────────────
      /** Master switch for the site-wide drawer. */
      drawerEnabled?: boolean;
      drawerSide?: SiteDrawerSide;
      /** Panel width in pixels (min 200). */
      drawerWidthPx?: number;
      drawerAnimation?: SiteDrawerAnimation;
      drawerAnimationDurationMs?: number;
      /** How the drawer opens on the live site. */
      drawerTrigger?: SiteDrawerTrigger;
      drawerTriggerLabel?: string;
      drawerTriggerLabelAr?: string;
      drawerTriggerIcon?: SiteDrawerIcon;
      drawerTitle?: string;
      drawerTitleAr?: string;
      drawerShowTitle?: boolean;
      drawerLinks?: SiteDrawerLink[];
      drawerBackgroundColor?: string;
      drawerTextColor?: string;
      drawerAccentColor?: string;
      drawerTriggerBackgroundColor?: string;
      drawerTriggerTextColor?: string;
      drawerOverlay?: boolean;
      drawerOverlayOpacityPercent?: number;
      drawerCloseOnOverlayClick?: boolean;
      drawerCloseOnEsc?: boolean;
      drawerShowCloseButton?: boolean;
      drawerStartOpen?: boolean;
      drawerShowOnMobile?: boolean;
      drawerShowOnDesktop?: boolean;
    }
>;

// ─── Root config ─────────────────────────────────────────────────────────────

export const Root: RootConfig<{
  props: RootProps;
  fields: {
    userField: { type: "userField"; option: boolean };
  };
}> = {
  fields: {
    __siteHeader: sectionHeader({
      title: "Page",
      description: "Global page-level metadata.",
      icon: <Type size={14} />,
      accent: "slate",
    }),
    title: bilingualTextField({ label: "Page title" }),
  } as any,
  defaultProps: {
    title: { ar: "متجر SOOQ", en: "SOOQ Store" },
    enableHtmlRichTextBlock: false,
    direction: "rtl",
    language: "ar",
    currency: "SYP",
    headerVisible: true,
    headerBrandHref: "/",
    headerLinks: DEFAULT_HEADER_LINKS,
    headerBackgroundColor: "",
    headerTextColor: "",
    headerShowDrawerButton: false,
    headerDrawerButtonIcon: "menu",
    footerVisible: true,
    footerTagline: "",
    footerTaglineAr: "",
    footerColumns: DEFAULT_FOOTER_COLUMNS,
    footerBackgroundColor: "",
    footerTextColor: "",
    drawerEnabled: false,
    drawerSide: "left",
    drawerWidthPx: 320,
    drawerAnimation: "slide",
    drawerAnimationDurationMs: 260,
    drawerTrigger: "external",
    drawerTriggerLabel: "Menu",
    drawerTriggerLabelAr: "القائمة",
    drawerTriggerIcon: "menu",
    drawerTitle: "Menu",
    drawerTitleAr: "القائمة",
    drawerShowTitle: true,
    drawerLinks: DEFAULT_DRAWER_LINKS,
    drawerBackgroundColor: "#ffffff",
    drawerTextColor: "#111827",
    drawerAccentColor: "#2563eb",
    drawerTriggerBackgroundColor: "#ffffff",
    drawerTriggerTextColor: "#111827",
    drawerOverlay: true,
    drawerOverlayOpacityPercent: 50,
    drawerCloseOnOverlayClick: true,
    drawerCloseOnEsc: true,
    drawerShowCloseButton: true,
    drawerStartOpen: false,
    drawerShowOnMobile: true,
    drawerShowOnDesktop: true,
    ...DEFAULT_THEME,
    ...DEFAULT_COLORS,
    ...DEFAULT_BADGE,
    ...DEFAULT_SHELL,
    ...DEFAULT_SCALES,
    ...DEFAULT_BREAKPOINTS,
  },

  render: (props) => {
    const outer = useActiveLanguage();
    if (outer.__provided) {
      return <RootShell {...props} />;
    }
    const p = props as RootProps;
    return (
      <LanguageProvider initialLanguage={p.language ?? "ar"}>
        <RootShell {...props} />
      </LanguageProvider>
    );
  },
};

function RootShell(props: DefaultRootRenderProps<RootProps>) {
    const p = props as any;
    const {
      badgeShape = DEFAULT_BADGE.badgeShape,
      badgeStyle = DEFAULT_BADGE.badgeStyle,
      pageFullScreen = false,
      puck: { isEditing, renderDropZone: DropZone, metadata },
    } = p;

    // The mobile shell is the per-page AppBar plus the site Sidebar drawer —
    // the desktop header/footer zones are not part of it, so they never render
    // in the mobile editor / preview (they stay in the JSON for desktop).
    const hideShellZones = pageFullScreen || isMobileEditorMetadata(metadata);

    const { language, direction } = useActiveLanguage();

    const colors: ColorTheme = {} as ColorTheme;
    COLOR_KEYS.forEach(({ key }) => {
      colors[key] = (p[key] as string) ?? DEFAULT_COLORS[key];
    });

    const fonts = resolveThemeFontVars({
      bodyFont: p.bodyFont as string | undefined,
      fontOption1: p.fontOption1 as string | undefined,
      fontOption2: p.fontOption2 as string | undefined,
    });

    const shape = badgeShape as BadgeShape;
    const bStyle = badgeStyle as BadgeStyle;
    const badgeVars = computeBadgeThemeVars(
      shape,
      bStyle,
      colors.error,
      colors.success,
      colors.neutral
    );
    const derivedColorVars = computeDerivedColorThemeVars(colors);

    const scaleVars = computeScaleThemeVars(
      p as Partial<typeof DEFAULT_SCALES>
    );
    const buttonVariantVars = computeButtonVariantThemeVars(
      p as Partial<FullThemeProps>
    );

    const bp = normalizeBreakpoints({
      breakpointMobileMax: p.breakpointMobileMax as number | undefined,
      breakpointTabletMax: p.breakpointTabletMax as number | undefined,
    });
    const responsiveLayoutCss = buildResponsiveLayoutCss(bp);

    const themeVars: Record<string, string> = {
      ...fonts.cssVars,
      fontFamily: "var(--theme-body-font)",
      color: "var(--theme-color-text)",
      backgroundColor: "var(--theme-color-background)",
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      ...badgeVars,
      ...derivedColorVars,
      ...scaleVars,
      ...buttonVariantVars,
    };
    COLOR_KEYS.forEach(({ key }) => {
      themeVars[colorVar(key)] = colors[key];
    });

    const rootClass = getThemeRootClassNames(bStyle, shape);
    return (
      <>
        <style
          id="puck-responsive-layout"
          dangerouslySetInnerHTML={{ __html: responsiveLayoutCss }}
        />

        <div
          className={rootClass}
          style={themeVars as CSSProperties}
          dir={direction}
          lang={language}
          {...fonts.dataAttrs}
        >
          {hideShellZones ? null : (
            <DropZone
              zone={ZONE_HEADER}
              allow={["Section"]}
              disallow={["SiteHeader", "SiteFooter"]}
              minEmptyHeight={isEditing ? 72 : 0}
              style={
                isEditing
                  ? { borderBottom: "1px dashed rgba(37, 99, 235, 0.25)" }
                  : // Avoid a wrapper box so sticky/fixed Layout on the header
                    // Section sticks relative to the page, not a short parent.
                    { display: "contents" }
              }
            />
          )}

          <div style={{ display: "flex", flexGrow: 1, minHeight: 0, flexDirection: "column" }}>
            <DropZone
              zone="default-zone"
              allow={["Section"]}
              style={{ flexGrow: 1 }}
            />
          </div>

          {hideShellZones ? null : (
            <DropZone
              zone={ZONE_FOOTER}
              allow={["Section"]}
              disallow={["SiteHeader", "SiteFooter"]}
              minEmptyHeight={isEditing ? 72 : 0}
              style={
                isEditing
                  ? { borderTop: "1px dashed rgba(37, 99, 235, 0.25)" }
                  : { display: "contents" }
              }
            />
          )}

          {/* Overlay zones — managed via Zones plugin; hidden drop chrome in editor */}
          <DropZone
            zone={ZONE_DRAWER}
            allow={["ZoneDrawer", "SiteDrawerShell"]}
            style={
              isEditing
                ? { height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }
                : { display: "contents" }
            }
          />
          <DropZone
            zone={ZONE_POPUP}
            allow={["ZonePopup"]}
            style={
              isEditing
                ? { height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }
                : { display: "contents" }
            }
          />
          <DropZone
            zone={ZONE_BOTTOM_SHEET}
            allow={["ZoneBottomSheet"]}
            style={
              isEditing
                ? { height: 0, overflow: "hidden", opacity: 0, pointerEvents: "none" }
                : { display: "contents" }
            }
          />
        </div>
      </>
    );
}

export default Root;
