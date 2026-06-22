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
  getFontCssValue,
  getGoogleFontsUrl,
  ThemeProps,
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
import { SHELL_LEFT_ZONE, SHELL_RIGHT_ZONE } from "./shell-zones";

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
      title?: string;
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
    title: {
      type: "text",
      label: "Page title",
    },
  } as any,
  defaultProps: {
    title: "متجر Ertqaa",
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
    const p = props as any;
    const {
      bodyFont = DEFAULT_THEME.bodyFont,
      fontOption1 = DEFAULT_THEME.fontOption1,
      fontOption2 = DEFAULT_THEME.fontOption2,
      badgeShape = DEFAULT_BADGE.badgeShape,
      badgeStyle = DEFAULT_BADGE.badgeStyle,
      direction = "rtl",
      language = "ar",
      puck: { isEditing, renderDropZone: DropZone },
    } = p;

    const colors: ColorTheme = {} as ColorTheme;
    COLOR_KEYS.forEach(({ key }) => {
      colors[key] = (p[key] as string) ?? DEFAULT_COLORS[key];
    });

    const bf = (bodyFont as string) ?? DEFAULT_THEME.bodyFont;
    const f1 = (fontOption1 as string) ?? DEFAULT_THEME.fontOption1;
    const f2 = (fontOption2 as string) ?? DEFAULT_THEME.fontOption2;

    const bodyFontCss = getFontCssValue(bf);
    const font1Css = getFontCssValue(f1);
    const font2Css = getFontCssValue(f2);
    const googleFontsUrl = getGoogleFontsUrl([bf, f1, f2]);

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
      "--theme-body-font": bodyFontCss,
      "--theme-font-1": font1Css,
      "--theme-font-2": font2Css,
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
    const shellRailStyle: CSSProperties = isEditing
      ? {
          width: "56px",
          minWidth: "56px",
          flexShrink: 0,
        }
      : {
          width: 0,
          minWidth: 0,
          flexShrink: 0,
          overflow: "hidden",
        };

    const shellDropStyle: CSSProperties = isEditing
      ? {
          minHeight: "100%",
          background: "rgba(37, 99, 235, 0.06)",
          borderInline: "1px dashed rgba(37, 99, 235, 0.35)",
        }
      : {
          minHeight: 0,
        };

    return (
      <>
        <style
          id="puck-responsive-layout"
          dangerouslySetInnerHTML={{ __html: responsiveLayoutCss }}
        />
        {!isEditing && googleFontsUrl && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link rel="stylesheet" href={googleFontsUrl} />
          </>
        )}

        <div
          className={rootClass}
          style={themeVars as CSSProperties}
          dir={direction}
          lang={language}
        >
          <div style={{ display: "flex", flexGrow: 1, minHeight: 0 }}>
            <div style={shellRailStyle}>
              <DropZone
                zone={SHELL_LEFT_ZONE}
                allow={["SiteDrawerShell"]}
                minEmptyHeight={isEditing ? "100vh" : 0}
                style={shellDropStyle}
              />
            </div>

            <DropZone
              zone="default-zone"
              allow={["SiteHeader", "Section", "SiteFooter"]}
              style={{ flexGrow: 1 }}
            />

            <div style={shellRailStyle}>
              <DropZone
                zone={SHELL_RIGHT_ZONE}
                allow={["SiteDrawerShell"]}
                minEmptyHeight={isEditing ? "100vh" : 0}
                style={shellDropStyle}
              />
            </div>
          </div>
        </div>
      </>
    );
  },
};

export default Root;
