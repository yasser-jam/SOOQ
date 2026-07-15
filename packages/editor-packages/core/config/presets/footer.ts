import type { ZonePreset } from "./types";
import { createHeading, createParagraph } from "./shared";
import {
  DEFAULT_FOOTER_BOTTOM,
  DEFAULT_FOOTER_BOTTOM_LINKS_NAV,
  DEFAULT_FOOTER_TAGLINE,
  createDefaultFooterColumns,
  createFooterSection,
} from "./zone-shell";

const footerCommerceFull: ZonePreset = {
  id: "footer-commerce-full",
  category: "zone-footer",
  title: "تذييل تجاري — أعمدة كاملة",
  previewImage:
    "https://placehold.co/800x320/10213a/f8fafc?text=Commerce+Footer",
  componentData: createFooterSection(
    {
      backgroundColor: "#10213a",
      theme: "light",
    },
    [
      {
        type: "Group",
        props: {
          direction: "row",
          gap: 24,
          alignItems: "flex-start",
          justifyContent: "space-between",
          wrap: "wrap",
          backgroundColor: "",
          padding: "0px",
          borderRadius: "theme-none",
          boxShadow: "none",
          content: [
            {
              type: "Group",
              props: {
                direction: "column",
                gap: 8,
                alignItems: "flex-start",
                justifyContent: "flex-start",
                wrap: "nowrap",
                backgroundColor: "",
                padding: "0px",
                borderRadius: "theme-none",
                boxShadow: "none",
                content: [
                  createHeading("متجري", {
                    fontSize: "theme-xl",
                    fontWeight: "theme-bold",
                    color: "theme-surface",
                  }),
                  createParagraph("متجرك الشامل للسلع المختارة بعناية.", {
                    color: "theme-muted",
                    fontSize: "theme-sm",
                    textAlign: "right",
                  }),
                ],
              },
            },
            ...createDefaultFooterColumns(),
          ],
        },
      },
      DEFAULT_FOOTER_BOTTOM_LINKS_NAV,
      DEFAULT_FOOTER_BOTTOM,
    ]
  ),
};

const footerDefaultClassic: ZonePreset = {
  id: "footer-default-classic",
  category: "zone-footer",
  title: "تذييل كلاسيكي — أعمدة",
  previewImage:
    "https://placehold.co/800x320/f8fafc/64748b?text=Classic+Footer",
  componentData: createFooterSection(
    {
      backgroundColor: "#f8fafc",
      theme: "dark",
    },
    [
      createHeading("متجري", {
        fontSize: "theme-xl",
        fontWeight: "theme-bold",
      }),
      DEFAULT_FOOTER_TAGLINE,
      {
        type: "Group",
        props: {
          direction: "row",
          gap: 32,
          alignItems: "flex-start",
          justifyContent: "flex-start",
          wrap: "wrap",
          backgroundColor: "",
          padding: "0px",
          borderRadius: "theme-none",
          boxShadow: "none",
          content: createDefaultFooterColumns().slice(0, 2),
        },
      },
      DEFAULT_FOOTER_BOTTOM,
    ]
  ),
};

const footerCommerceMinimal: ZonePreset = {
  id: "footer-commerce-minimal",
  category: "zone-footer",
  title: "تذييل تجاري — مبسّط",
  previewImage:
    "https://placehold.co/800x240/1f2937/f8fafc?text=Minimal+Footer",
  componentData: createFooterSection(
    {
      backgroundColor: "#1f2937",
      theme: "light",
      paddingTop: "32px",
      paddingBottom: "32px",
    },
    [
      createHeading("متجري", {
        fontSize: "theme-lg",
        fontWeight: "theme-semibold",
        color: "theme-surface",
      }),
      {
        type: "Group",
        props: {
          direction: "row",
          gap: 24,
          alignItems: "flex-start",
          justifyContent: "flex-start",
          wrap: "wrap",
          backgroundColor: "",
          padding: "0px",
          borderRadius: "theme-none",
          boxShadow: "none",
          content: createDefaultFooterColumns().slice(0, 2),
        },
      },
    ]
  ),
};

export const ZONE_FOOTER_PRESETS: ZonePreset[] = [
  footerCommerceFull,
  footerDefaultClassic,
  footerCommerceMinimal,
];

export const DEFAULT_ZONE_FOOTER_PRESET = footerDefaultClassic;

/** @deprecated Use ZONE_FOOTER_PRESETS */
export const FOOTER_PRESETS = ZONE_FOOTER_PRESETS;
