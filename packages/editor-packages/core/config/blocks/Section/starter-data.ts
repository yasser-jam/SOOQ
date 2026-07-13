import { Slot } from "@/core/types";

export const DEFAULT_SECTION_NAME = "قسم جديد";

export const createStarterTextBlock = (
  text = "استخدم هذه المساحة لتقديم عرضك وشرح فائدته وتوجيه المتسوقين إلى الخطوة التالية."
) => ({
  type: "ContentParagraph",
  props: {
    text,
    textAlign: "left",
  },
});

export const createStarterHeadingBlock = (
  text = "وصل حديثاً إلى متجرك"
) => ({
  type: "ContentHeading",
  props: {
    text,
    level: "2",
    textAlign: "left",
  },
});

export const createStarterButtonBlock = (label = "تسوق الآن") => ({
  type: "ContentButton",
  props: {
    label,
    align: "center",
  },
});

export const createSectionStarterContent = (): Slot => [
  createStarterHeadingBlock("وصل حديثاً إلى متجرك"),
  createStarterTextBlock(
    "أضف نصاً داعماً هنا لوصف هذا القسم وتوجيه الزوار نحو الإجراء التالي."
  ),
  createStarterButtonBlock("اطلب الآن"),
];

export const createLayoutStarterContent = (): Slot => [
  createStarterHeadingBlock("روّج لعرض مميز"),
  createStarterTextBlock("اجمع هذا العنصر مع بطاقات المنتجات أو الصور أو الروابط."),
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
