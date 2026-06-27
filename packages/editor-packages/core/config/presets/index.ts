import type { ComponentDataOptionalId } from "@/core/types";

export type SectionPresetCategory =
  | "general"
  | "header"
  | "footer"
  | "products-grid";

export type SectionPreset = {
  id: string;
  category: SectionPresetCategory;
  title: string;
  /** Placeholder preview image URL (shown in Add Section dialog) */
  previewImage?: string;
  /** Full Section tree; ids are placeholders regenerated on insert */
  componentData: ComponentDataOptionalId;
};

export const PRESET_CATEGORY_LABELS: Record<SectionPresetCategory, string> = {
  general: "عام",
  header: "رأس الصفحة",
  footer: "تذييل",
  "products-grid": "شبكة المنتجات",
};

export const PRESET_CATEGORY_ORDER: SectionPresetCategory[] = [
  "general",
  "header",
  "footer",
  "products-grid",
];

const PLACEHOLDER_IMAGE =
  "https://placehold.co/800x500/e2e8f0/64748b?text=Preview";

/** Preset 1 — Image left, title + text + button right (1 col on mobile) */
const imageTextTwoColumns: SectionPreset = {
  id: "image-text-two-columns",
  category: "general",
  title: "صورة ونص (عمودان)",
  previewImage: PLACEHOLDER_IMAGE,
  componentData: {
    type: "Section",
    props: {
      name: "Image & text",
      columns: 2,
      columnsMobile: 1,
      gridGap: "48px",
      paddingTop: "80px",
      paddingBottom: "80px",
      paddingHorizontal: "24px",
      backgroundColor: "#ffffff",
      theme: "dark",
      maxWidth: "1280px",
      content: [
        {
          type: "ContentImage",
          props: {
            src: "https://placehold.co/800x500/e2e8f0/64748b?text=Image",
            alt: "",
            align: "center",
            objectFit: "cover",
            radius: "theme-md",
            maxWidth: "100%",
          },
        },
        {
          type: "Group",
          props: {
            direction: "column",
            gap: 16,
            alignItems: "flex-start",
            justifyContent: "center",
            wrap: "nowrap",
            content: [
              {
                type: "ContentHeading",
                props: {
                  text: "Your title here",
                  textAlign: "left",
                  fontFamily: "body",
                  fontSize: "theme-2xl",
                  fontWeight: "theme-bold",
                  lineHeight: "theme-normal",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-text",
                },
              },
              {
                type: "ContentParagraph",
                props: {
                  text: "Add supporting description text that explains your offer and guides shoppers to take action.",
                  textAlign: "left",
                  fontFamily: "body",
                  fontSize: "theme-md",
                  fontWeight: "theme-normal",
                  lineHeight: "theme-relaxed",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-text",
                },
              },
              {
                type: "ContentButton",
                props: {
                  label: "Shop now",
                  align: "left",
                  destinationType: "link",
                  buttonAction: "link",
                  link: { kind: "none" },
                  buttonVariantMode: "variant",
                  buttonVariant: "primary",
                  buttonVariantSize: "md",
                  radius: "theme-md",
                  bgColor: "theme-primary",
                  textColor: "theme-surface",
                  buttonSize: "theme-md",
                },
              },
            ],
          },
        },
      ],
    },
  },
};

/** Preset 2 — Centered headline + CTA over background image (not Hero block) */
const bannerBackgroundImage: SectionPreset = {
  id: "banner-background-image",
  category: "general",
  title: "بانر مع صورة خلفية",
  previewImage: "https://placehold.co/1280x600/1f2937/f8fafc?text=Banner",
  componentData: {
    type: "Section",
    props: {
      name: "بانر",
      columns: 1,
      columnsMobile: 1,
      gridGap: "24px",
      paddingTop: "120px",
      paddingBottom: "120px",
      paddingHorizontal: "24px",
      backgroundColor: "#0f172a",
      backgroundImage: "https://placehold.co/1280x600/334155/f8fafc?text=Background",
      backgroundOverlayColor: "rgba(0, 0, 0, 0.45)",
      theme: "light",
      maxWidth: "1280px",
      content: [
        {
          type: "Group",
          props: {
            direction: "column",
            gap: 20,
            alignItems: "center",
            justifyContent: "center",
            wrap: "nowrap",
            content: [
              {
                type: "ContentHeading",
                props: {
                  text: "Big headline",
                  textAlign: "center",
                  fontFamily: "body",
                  fontSize: "theme-2xl",
                  fontWeight: "theme-bold",
                  lineHeight: "theme-normal",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-surface",
                },
              },
              {
                type: "ContentParagraph",
                props: {
                  text: "Supporting text that reinforces your message and invites visitors to explore.",
                  textAlign: "center",
                  fontFamily: "body",
                  fontSize: "theme-lg",
                  fontWeight: "theme-normal",
                  lineHeight: "theme-relaxed",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-surface",
                },
              },
              {
                type: "ContentButton",
                props: {
                  label: "Get started",
                  align: "center",
                  destinationType: "link",
                  buttonAction: "link",
                  link: { kind: "none" },
                  buttonVariantMode: "variant",
                  buttonVariant: "primary",
                  buttonVariantSize: "md",
                  radius: "theme-md",
                  bgColor: "theme-primary",
                  textColor: "theme-surface",
                  buttonSize: "theme-md",
                },
              },
            ],
          },
        },
      ],
    },
  },
};

/** Preset 3 — Three feature cards with icons */
const threeFeatureCards: SectionPreset = {
  id: "three-feature-cards",
  category: "general",
  title: "ثلاث بطاقات مميزات",
  previewImage: PLACEHOLDER_IMAGE,
  componentData: {
    type: "Section",
    props: {
      name: "Features",
      columns: 3,
      columnsMobile: 1,
      gridGap: "24px",
      paddingTop: "80px",
      paddingBottom: "80px",
      paddingHorizontal: "24px",
      backgroundColor: "#ffffff",
      theme: "dark",
      maxWidth: "1280px",
      content: [
        {
          type: "Card",
          props: {
            title: "Fast delivery",
            description: "Get orders to your customers quickly and reliably.",
            icon: "truck",
            mode: "flat",
          },
        },
        {
          type: "Card",
          props: {
            title: "Secure checkout",
            description: "Safe payments and a smooth buying experience.",
            icon: "shield-check",
            mode: "flat",
          },
        },
        {
          type: "Card",
          props: {
            title: "24/7 support",
            description: "We're here whenever your customers need help.",
            icon: "headphones",
            mode: "flat",
          },
        },
      ],
    },
  },
};

/** Preset 4 — Asymmetric promo cards using styled Groups */
const asymmetricPromoCards: SectionPreset = {
  id: "asymmetric-promo-cards",
  category: "general",
  title: "بطاقات عروض غير متماثلة",
  previewImage: PLACEHOLDER_IMAGE,
  componentData: {
    type: "Section",
    props: {
      name: "Promo cards",
      columns: 4,
      columnsMobile: 1,
      gridGap: "24px",
      paddingTop: "80px",
      paddingBottom: "80px",
      paddingHorizontal: "24px",
      backgroundColor: "#ffffff",
      theme: "dark",
      maxWidth: "1280px",
      content: [
        {
          type: "Group",
          props: {
            direction: "column",
            gap: 16,
            alignItems: "flex-start",
            justifyContent: "center",
            wrap: "nowrap",
            backgroundColor: "theme-primary",
            padding: "40px",
            borderRadius: "theme-lg",
            boxShadow: "md",
            layout: { spanCol: 3 },
            content: [
              {
                type: "ContentHeading",
                props: {
                  text: "Main promotion",
                  textAlign: "left",
                  fontFamily: "body",
                  fontSize: "theme-xl",
                  fontWeight: "theme-bold",
                  lineHeight: "theme-normal",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-surface",
                },
              },
              {
                type: "ContentParagraph",
                props: {
                  text: "Highlight your best offer with a bold primary card.",
                  textAlign: "left",
                  fontFamily: "body",
                  fontSize: "theme-md",
                  fontWeight: "theme-normal",
                  lineHeight: "theme-relaxed",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-surface",
                },
              },
              {
                type: "ContentButton",
                props: {
                  label: "Shop collection",
                  align: "left",
                  destinationType: "link",
                  buttonAction: "link",
                  link: { kind: "none" },
                  buttonVariantMode: "variant",
                  buttonVariant: "secondary",
                  buttonVariantSize: "md",
                  radius: "theme-md",
                  bgColor: "theme-secondary",
                  textColor: "theme-text",
                  buttonSize: "theme-md",
                },
              },
            ],
          },
        },
        {
          type: "Group",
          props: {
            direction: "column",
            gap: 12,
            alignItems: "flex-start",
            justifyContent: "center",
            wrap: "nowrap",
            backgroundColor: "#f3f4f6",
            padding: "40px",
            borderRadius: "theme-lg",
            boxShadow: "sm",
            layout: { spanCol: 1 },
            content: [
              {
                type: "ContentHeading",
                props: {
                  text: "Side note",
                  textAlign: "left",
                  fontFamily: "body",
                  fontSize: "theme-lg",
                  fontWeight: "theme-semibold",
                  lineHeight: "theme-normal",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-text",
                },
              },
              {
                type: "ContentParagraph",
                props: {
                  text: "A smaller complementary message.",
                  textAlign: "left",
                  fontFamily: "body",
                  fontSize: "theme-sm",
                  fontWeight: "theme-normal",
                  lineHeight: "theme-relaxed",
                  fontStyle: "normal",
                  textTransform: "none",
                  color: "theme-text",
                },
              },
            ],
          },
        },
      ],
    },
  },
};

export const SECTION_PRESETS: SectionPreset[] = [
  imageTextTwoColumns,
  bannerBackgroundImage,
  threeFeatureCards,
  asymmetricPromoCards,
];

export function getPresetsByCategory(
  category: SectionPresetCategory
): SectionPreset[] {
  return SECTION_PRESETS.filter((preset) => preset.category === category);
}
