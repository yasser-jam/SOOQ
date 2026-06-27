import type { SectionPreset } from "./types";
import {
  PLACEHOLDER_IMAGE,
  createHeading,
  createParagraph,
  createPrimaryButton,
  createSection,
} from "./shared";

const imageTextTwoColumns: SectionPreset = {
  id: "image-text-two-columns",
  category: "general",
  title: "صورة ونص (عمودان)",
  previewImage: PLACEHOLDER_IMAGE,
  componentData: createSection({
    name: "Image & text",
    columns: 2,
    columnsMobile: 1,
    gridGap: "48px",
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
            createHeading("Your title here"),
            createParagraph(
              "Add supporting description text that explains your offer and guides shoppers to take action."
            ),
            createPrimaryButton("Shop now"),
          ],
        },
      },
    ],
  }),
};

const threeFeatureCards: SectionPreset = {
  id: "three-feature-cards",
  category: "general",
  title: "ثلاث بطاقات مميزات",
  previewImage: PLACEHOLDER_IMAGE,
  componentData: createSection({
    name: "Features",
    columns: 3,
    columnsMobile: 1,
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
  }),
};

const asymmetricPromoCards: SectionPreset = {
  id: "asymmetric-promo-cards",
  category: "general",
  title: "بطاقات عروض غير متماثلة",
  previewImage: PLACEHOLDER_IMAGE,
  componentData: createSection({
    name: "Promo cards",
    columns: 4,
    columnsMobile: 1,
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
            createHeading("Main promotion", {
              color: "theme-surface",
              fontSize: "theme-xl",
            }),
            createParagraph("Highlight your best offer with a bold primary card.", {
              color: "theme-surface",
            }),
            createPrimaryButton("Shop collection", {
              buttonVariant: "secondary",
              bgColor: "theme-secondary",
              textColor: "theme-text",
            }),
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
            createHeading("Side note", {
              fontSize: "theme-lg",
              fontWeight: "theme-semibold",
            }),
            createParagraph("A smaller complementary message.", {
              fontSize: "theme-sm",
            }),
          ],
        },
      },
    ],
  }),
};

export const GENERAL_PRESETS: SectionPreset[] = [
  imageTextTwoColumns,
  threeFeatureCards,
  asymmetricPromoCards,
];
