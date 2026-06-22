import { Slot } from "@/core/types";

export const DEFAULT_SECTION_NAME = "New Section";

export const createStarterTextBlock = (
  text = "Use this space to introduce your offer, explain the benefit, and guide shoppers to the next step."
) => ({
  type: "ContentParagraph",
  props: {
    text,
    textAlign: "left",
  },
});

export const createStarterHeadingBlock = (
  text = "Fresh arrivals for your store"
) => ({
  type: "ContentHeading",
  props: {
    text,
    level: "2",
    textAlign: "left",
  },
});

export const createStarterButtonBlock = (label = "Shop now") => ({
  type: "ContentButton",
  props: {
    label,
    align: "center",
  },
});

export const createSectionStarterContent = (): Slot => [
  createStarterHeadingBlock("Fresh arrivals for your store"),
  createStarterTextBlock(
    "Add supporting text here to describe this section and guide visitors toward the next action."
  ),
  createStarterButtonBlock("Call to action"),
];

export const createLayoutStarterContent = (): Slot => [
  createStarterHeadingBlock("Promote a key offer"),
  createStarterTextBlock("Pair this block with product cards, images, or links."),
];

export const createSidebarStarterContent = (): Slot => [
  {
    type: "NavMenu",
    props: {
      orientation: "vertical",
      variant: "plain",
      activePath: "",
      items: [
        {
          label: { ar: "الرئيسية", en: "Home" },
          link: { kind: "page", pageId: "/" },
        },
        {
          label: { ar: "المنتجات", en: "Products" },
          link: { kind: "page", pageId: "/products/example-product" },
        },
        {
          label: { ar: "السلة", en: "Cart" },
          link: { kind: "page", pageId: "/cart" },
        },
      ],
    },
  },
];
