import type { FullThemeProps } from "./theme";
import { DEFAULT_THEME, DEFAULT_COLORS } from "./theme";
import type { UserData } from "./types";
import { products } from "./data/products";

const galleryRootProps = {
  title: "Theme gallery",
  ...DEFAULT_THEME,
  ...DEFAULT_COLORS,
};

// ─── Single alternate theme (contrasts with default home: system fonts + blue) ─

export type ThemePresetDefinition = {
  id: string;
  label: string;
  description: string;
  previewColor: string;
  themeProps: FullThemeProps;
};

/** Editorial / luxury direction: serif headlines, warm stone + burgundy, Merriweather body */
export const ATELIER_PRESET: ThemePresetDefinition = {
  id: "atelier",
  label: "Atelier",
  description:
    "Serif headings, warm neutrals, and a wine accent — clearly distinct from the default store theme.",
  previewColor: "#9f1239",
  themeProps: {
    bodyFont: "merriweather",
    fontOption1: "playfair-display",
    fontOption2: "raleway",
    primary: "#9f1239",
    surface: "#faf7f5",
    success: "#166534",
    warning: "#b45309",
    error: "#b91c1c",
    dark: "#1c1917",
    text: "#44403c",
    neutral: "#78716c",
  },
};

/** Only one demo theme besides the default home page */
export const THEME_PRESETS: ThemePresetDefinition[] = [ATELIER_PRESET];

export function getThemePresetById(
  id: string
): ThemePresetDefinition | undefined {
  return THEME_PRESETS.find((t) => t.id === id);
}

export function themeDemoPath(id: string): string {
  return `/themes/${id}`;
}

export function themeDemoEditPath(id: string): string {
  return `${themeDemoPath(id)}/edit`;
}

// ─── Theme gallery (/themes) — single CTA to the Atelier demo ───────────────

export function buildThemesGalleryData(): UserData {
  return {
    root: {
      props: galleryRootProps,
    },
    zones: {},
    content: [
      {
        type: "Section",
        props: {
          id: "Section-themes-gallery",
          paddingTop: "80px",
          paddingBottom: "80px",
          paddingHorizontal: "24px",
          backgroundColor: "#ffffff",
          theme: "dark",
          maxWidth: "720px",
          content: [
            {
              type: "Heading",
              props: {
                id: "Heading-themes-gallery",
                align: "center",
                level: "1",
                text: "Alternate theme",
                fontFamily: "option1",
                layout: { padding: "0px" },
                size: "xxl",
                colorMode: "theme",
                colorTheme: "text",
                colorFixed: "#0f172a",
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-themes-1",
                size: "16px",
                direction: "vertical",
              },
            },
            {
              type: "Text",
              props: {
                id: "Text-themes-intro",
                align: "center",
                text: "Open the Atelier demo: same section structure as the home page (hero, collection, two about blocks) with a different layout, palette, and font stack. Tweak tokens in Settings.",
                layout: { padding: "0px" },
                size: "m",
                color: "muted",
                fontFamily: "body",
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-themes-2",
                size: "28px",
                direction: "vertical",
              },
            },
            {
              type: "Flex",
              props: {
                id: "Flex-themes-buttons",
                justifyContent: "center",
                direction: "row",
                gap: 12,
                wrap: "wrap",
                layout: { padding: "0px" },
                items: [
                  {
                    type: "Button",
                    props: {
                      id: "Button-theme-atelier",
                      label: "Edit Atelier theme",
                      buttonAction: "link",
                      link: {
                        kind: "page",
                        pageId: themeDemoEditPath("atelier"),
                      },
                      href: themeDemoEditPath("atelier"),
                      variant: "primary",
                    },
                  },
                ],
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-themes-3",
                size: "20px",
                direction: "vertical",
              },
            },
            {
              type: "Text",
              props: {
                id: "Text-themes-hint",
                align: "center",
                text: "Use the Themes tab in the sidebar for a quick link.",
                layout: { padding: "0px" },
                size: "s",
                color: "muted",
                fontFamily: "body",
              },
            },
          ],
        },
      },
    ],
  } as UserData;
}

export function buildAllThemeDemoInitialEntries(): Record<string, UserData> {
  return {
    [themeDemoPath(ATELIER_PRESET.id)]: buildAtelierThemeDemoPageData(),
  };
}

// ─── /themes/atelier — 4 sections like home: hero, products, about×2 (no CTA bg) ─

function buildAtelierThemeDemoPageData(): UserData {
  const p = ATELIER_PRESET.themeProps;

  return {
    root: {
      props: {
        title: "Lumière Atelier — demo",
        bodyFont: p.bodyFont,
        fontOption1: p.fontOption1,
        fontOption2: p.fontOption2,
        primary: p.primary,
        surface: p.surface,
        success: p.success,
        warning: p.warning,
        error: p.error,
        dark: p.dark,
        text: p.text,
        neutral: p.neutral,
      },
    },
    zones: {},
    content: [
      // ── 1. Hero — full-bleed background image, centered headline + CTA ───
      {
        type: "Section",
        props: {
          id: "Section-atelier-hero",
          paddingTop: "0px",
          paddingBottom: "0px",
          paddingHorizontal: "0px",
          backgroundColor: "transparent",
          theme: "dark",
          maxWidth: "100%",
          content: [
            {
              type: "Hero",
              props: {
                id: "Hero-atelier",
                title: "Lumière Atelier",
                description:
                  "<p>Objects for slow living — ceramics, textiles, and small-batch goods. Same structure as the home page, styled for an editorial, gallery-like feel.</p>",
                buttons: [
                  {
                    label: "View the collection",
                    href: "/products/example-product",
                    variant: "primary",
                  },
                  {
                    label: "Theme gallery",
                    href: "/themes",
                    variant: "secondary",
                  },
                ],
                align: "center",
                image: {
                  url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=2000&auto=format&fit=crop&q=80",
                  mode: "background",
                  backgroundAttachment: "scroll",
                  content: [],
                },
                padding: "140px",
              },
              readOnly: { title: false, description: false },
            },
          ],
        },
      },

      // ── 2. Products collection — 3 cards, dark cards on warm surface ───────
      {
        type: "Section",
        props: {
          id: "Section-atelier-products",
          paddingTop: "96px",
          paddingBottom: "96px",
          paddingHorizontal: "24px",
          backgroundColor: "#faf7f5",
          theme: "dark",
          maxWidth: "1280px",
          content: [
            {
              type: "Heading",
              props: {
                id: "Heading-atelier-collection",
                align: "center",
                level: "2",
                text: "The collection",
                fontFamily: "option1",
                layout: { padding: "0px" },
                size: "xxl",
                colorMode: "theme",
                colorTheme: "text",
                colorFixed: "#0f172a",
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-atelier-sub",
                size: "12px",
                direction: "vertical",
              },
            },
            {
              type: "Text",
              props: {
                id: "Text-atelier-collection",
                align: "center",
                text: "Three pieces, styled with the dark card treatment to contrast the default light storefront.",
                layout: { padding: "0px" },
                size: "m",
                color: "muted",
                fontFamily: "body",
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-atelier-grid",
                size: "40px",
                direction: "vertical",
              },
            },
            {
              type: "ProductsGrid",
              props: {
                id: "ProductsGrid-atelier",
                collection: null,
                metadata: null,
                columns: "3",
                maxRows: "0",
                gap: "md",
                layout: { padding: "0px" },
              },
            },
          ],
        },
      },

      // ── 3. About A — image left, copy right ────────────────────────────────
      {
        type: "Section",
        props: {
          id: "Section-atelier-about-a",
          paddingTop: "96px",
          paddingBottom: "96px",
          paddingHorizontal: "24px",
          backgroundColor: "#ffffff",
          theme: "dark",
          maxWidth: "1280px",
          content: [
            {
              type: "Group",
              props: {
                id: "Group-atelier-about-a",
                direction: "row",
                gap: 56,
                alignItems: "center",
                justifyContent: "flex-start",
                wrap: "wrap",
                layout: { padding: "0px" },
                content: [
                  {
                    type: "ProductImage",
                    props: {
                      id: "ProductImage-atelier-a",
                      product: { id: products[4]?.id ?? "", titleAr: products[4]?.title, titleEn: products[4]?.title },
                      aspectRatio: "landscape",
                      width: "400px",
                      borderRadius: "lg",
                      showBadges: false,
                      layout: {
                        grow: false,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                    },
                  },
                  {
                    type: "Group",
                    props: {
                      id: "Group-atelier-copy-a",
                      direction: "column",
                      gap: 20,
                      alignItems: "flex-start",
                      justifyContent: "center",
                      wrap: "nowrap",
                      layout: {
                        grow: true,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                      content: [
                        {
                          type: "Heading",
                          props: {
                            id: "Heading-atelier-about-a",
                            align: "left",
                            level: "2",
                            text: "Made by hand",
                            fontFamily: "option1",
                            layout: { padding: "0px" },
                            size: "xl",
                            colorMode: "theme",
                            colorTheme: "text",
                            colorFixed: "#0f172a",
                          },
                        },
                        {
                          type: "Text",
                          props: {
                            id: "Text-atelier-about-a",
                            align: "left",
                            text: "We work with a small circle of artisans. Every piece is photographed in natural light — the Atelier theme uses serif display type and warm neutrals so photography and copy feel like a lookbook, not a flyer.",
                            layout: { padding: "0px" },
                            size: "m",
                            color: "default",
                            fontFamily: "body",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },

      // ── 4. About B — copy left, image right (inverted) ─────────────────────
      {
        type: "Section",
        props: {
          id: "Section-atelier-about-b",
          paddingTop: "96px",
          paddingBottom: "96px",
          paddingHorizontal: "24px",
          backgroundColor: "#faf7f5",
          theme: "dark",
          maxWidth: "1280px",
          content: [
            {
              type: "Group",
              props: {
                id: "Group-atelier-about-b",
                direction: "row",
                gap: 56,
                alignItems: "center",
                justifyContent: "flex-start",
                wrap: "wrap",
                layout: { padding: "0px" },
                content: [
                  {
                    type: "Group",
                    props: {
                      id: "Group-atelier-copy-b",
                      direction: "column",
                      gap: 20,
                      alignItems: "flex-start",
                      justifyContent: "center",
                      wrap: "nowrap",
                      layout: {
                        grow: true,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                      content: [
                        {
                          type: "Heading",
                          props: {
                            id: "Heading-atelier-about-b",
                            align: "left",
                            level: "2",
                            text: "Visit the studio",
                            fontFamily: "option1",
                            layout: { padding: "0px" },
                            size: "xl",
                            colorMode: "theme",
                            colorTheme: "text",
                            colorFixed: "#0f172a",
                          },
                        },
                        {
                          type: "Text",
                          props: {
                            id: "Text-atelier-about-b",
                            align: "left",
                            text: "This second story block mirrors the home page’s “about” count but flips the layout: text leads, imagery follows. Raleway is used for secondary emphasis via theme option 2 in field labels where you wire it.",
                            layout: { padding: "0px" },
                            size: "m",
                            color: "default",
                            fontFamily: "body",
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "ProductImage",
                    props: {
                      id: "ProductImage-atelier-b",
                      product: { id: products[5]?.id ?? "", titleAr: products[5]?.title, titleEn: products[5]?.title },
                      aspectRatio: "landscape",
                      width: "400px",
                      borderRadius: "lg",
                      showBadges: false,
                      layout: {
                        grow: false,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  };
}
