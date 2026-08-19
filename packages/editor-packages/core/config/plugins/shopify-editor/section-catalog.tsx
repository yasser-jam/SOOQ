import React from "react";
import {
  LayoutTemplate,
  Sparkles,
  ShoppingCart,
  MessageSquareText,
  Images,
  Grid3x3,
  Columns3,
  IdCard,
  ListTree,
  Tags,
  ClipboardList,
  PanelTop,
  PanelBottom,
  Type as TypeIcon,
  Columns2,
  Rows2,
  PanelLeft,
} from "lucide-react";
import type { Data } from "@/core";
import {
  DEFAULT_SECTION_NAME,
  createStarterHeadingBlock,
  createStarterTextBlock,
  createSectionStarterContent,
} from "../../blocks/Section/starter-data";
import { createCartSectionPreset } from "../../presets/cart";
import {
  createContentLink,
  createHeading,
  createParagraph,
  createPrimaryButton,
} from "../../presets/shared";
import { SECTION_KIND_PRODUCTS_GRID, PRODUCTS_GRID_SECTION_METADATA } from "../../blocks/Section/products-grid-section";
import { createProductsPageInnerSection } from "../../presets/products-page";
import { createProductDetailSection } from "../../presets/products-grid";
import { createOrdersListSection } from "../../presets/orders";
import {
  HEADER_LAYOUT_OPTIONS,
  headerLayoutOptionToPreset,
} from "../../presets/header-layouts";
import { ZONE_FOOTER_PRESETS } from "../../presets/footer";
import type { ZonePreset } from "../../presets/types";
import type { CollectionPickerRef } from "@/modules/product/collection/data-store";

/**
 * Shopify-style Section Catalog.
 *
 * Each entry is a "preset" that can be inserted from the Add Section modal.
 * `kind: "section"` entries produce a fully-formed, JSON-serializable payload
 * (type + props, including any nested slot content) that the editor dispatches
 * into the page's root content. `kind: "zone"` entries replace a shell zone
 * (site-wide header/footer) via `applyZonePreset` instead — they affect every
 * page, not just the current one. **All state persists to `store_config.json`**
 * — there is no hidden editor-only state attached to a section.
 *
 * Only actively-supported blocks may be used here — never a block from
 * `conf.categories.legacy` in `config/index.tsx` (kept registered only so old
 * store_config.json documents still render). `registry-consistency.spec.ts`
 * and `section-catalog.spec.tsx` enforce this.
 *
 * Tabs (SRS-aligned, mirrors the Add Section dialog):
 *   - layout:   column/grid arrangements
 *   - elements: basic building blocks — header, footer, hero, rich text, FAQ, gallery
 *   - commerce: DSN-005 bound-to-tenant-data sections (products, cart, orders…)
 */

export type SectionCategory = "layout" | "elements" | "commerce";

/**
 * A config field that the AddSectionModal shows before inserting the preset.
 * Currently only "collection-picker" is supported.
 */
export type SectionPresetConfigField = {
  type: "collection-picker";
  /** Key used to pass the resolved value into build(params). */
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
};

export type SectionPreset = {
  kind: "section";
  /** Stable key — never rename (persisted in analytics, not in JSON). */
  id: string;
  label: string;
  description: string;
  category: SectionCategory;
  icon: React.ReactNode;
  /** CSS background for the card thumbnail (gradient, color, etc.). */
  gradient: string;
  /**
   * When present, clicking the preset opens a configure step in the modal
   * before inserting. The modal collects these fields and passes the results
   * to build() as params.
   */
  configFields?: SectionPresetConfigField[];
  /**
   * Build the ComponentData shape to insert into the root content array.
   * Always returns type "Section" so it satisfies the root DropZone
   * `allow={["Section"]}` contract — specialised presets wrap themselves
   * in a Section.
   *
   * For configurable presets, params carries the collected values:
   *   - params.collection — selected collection ref
   *   - params.collectionName — human-readable collection name
   */
  build: (params?: Record<string, unknown>) => {
    type: string;
    props: Record<string, unknown>;
  };
};

/**
 * A preset that replaces a whole shell zone (site header or footer) instead
 * of inserting into the current page. Applying one affects every page.
 */
export type ZoneSectionPreset = {
  kind: "zone";
  id: string;
  label: string;
  description: string;
  category: SectionCategory;
  icon: React.ReactNode;
  gradient: string;
  zoneTarget: "header" | "footer";
  preset: ZonePreset;
};

export type CatalogEntry = SectionPreset | ZoneSectionPreset;

// ─── Helpers ────────────────────────────────────────────────────────────────

// Section defaultProps mirror apps/demo/config/blocks/Section/index.tsx.
// Kept in sync manually rather than imported to keep preset metadata
// purely declarative.
type SectionBaseProps = {
  paddingTop: string;
  paddingBottom: string;
  paddingHorizontal: string;
  backgroundColor: string;
  theme: "light" | "dark";
  maxWidth: string;
  columns: number;
  gridGap: string;
};

const SECTION_BASE_PROPS: SectionBaseProps = {
  paddingTop: "64px",
  paddingBottom: "64px",
  paddingHorizontal: "24px",
  backgroundColor: "#ffffff",
  theme: "light",
  maxWidth: "1280px",
  columns: 1,
  gridGap: "24px",
};

const section = (
  overrides: Partial<SectionBaseProps> & {
    content?: unknown[];
  } = {}
) => ({
  type: "Section",
  props: {
    ...SECTION_BASE_PROPS,
    name: DEFAULT_SECTION_NAME,
    content: createSectionStarterContent(),
    ...overrides,
  },
});

const CATEGORY_CHIP_STYLE = {
  inactiveStyle: {
    bgColor: "theme-surface",
    textColor: "theme-text",
    radius: "theme-md",
    buttonSize: "theme-sm",
  },
  activeStyle: {
    bgColor: "theme-primary",
    textColor: "theme-surface",
    radius: "theme-md",
    buttonSize: "theme-sm",
  },
};

// IGNORED helpers (CategoryListMenu / OrderHistory / Wishlist / ContactForm)
// intentionally removed — do not reintroduce presets that insert those types,
// they are legacy (see conf.categories.legacy in config/index.tsx).

// ─── Catalog entries ────────────────────────────────────────────────────────

export const sectionCatalog: SectionPreset[] = [
  // ── Layout — column/grid arrangements ───────────────────────────────────
  {
    kind: "section",
    id: "empty-section",
    label: "قسم أساسي",
    description: "قسم بعمود واحد بعرض كامل — عنوان وفقرة وزر.",
    category: "layout",
    icon: <LayoutTemplate size={20} />,
    gradient: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
    build: () => section(),
  },
  {
    kind: "section",
    id: "narrow-content",
    label: "محتوى ضيق",
    description: "عمود مركزي للنصوص — مناسب لصفحات من نحن والسياسات.",
    category: "layout",
    icon: <Rows2 size={20} />,
    gradient: "linear-gradient(135deg, #fafafa 0%, #f3f4f6 100%)",
    build: () =>
      section({
        maxWidth: "768px",
        paddingTop: "48px",
        paddingBottom: "48px",
      }),
  },
  {
    kind: "section",
    id: "two-column",
    label: "تخطيط عمودين",
    description: "تقسيم المحتوى إلى عمودين متساويين.",
    category: "layout",
    icon: <Columns2 size={20} />,
    gradient:
      "linear-gradient(90deg, #eff6ff 0%, #eff6ff 50%, #f0fdf4 50%, #f0fdf4 100%)",
    build: () => section({ columns: 2, gridGap: "32px" }),
  },
  {
    kind: "section",
    id: "three-column",
    label: "تخطيط ثلاث أعمدة",
    description: "تقسيم المحتوى إلى ثلاثة أعمدة متساوية.",
    category: "layout",
    icon: <Columns3 size={20} />,
    gradient:
      "linear-gradient(90deg, #eff6ff 0%, #eff6ff 33%, #f0fdf4 33%, #f0fdf4 66%, #fdf4ff 66%, #fdf4ff 100%)",
    build: () => section({ columns: 3, gridGap: "24px" }),
  },
  {
    kind: "section",
    id: "content-with-sidebar",
    label: "محتوى مع قائمة جانبية",
    description:
      "عمودان: محتوى رئيسي في جهة وقائمة جانبية للفلاتر أو التنقل في الأخرى.",
    category: "layout",
    icon: <PanelLeft size={20} />,
    gradient:
      "linear-gradient(90deg, #f3f4f6 0%, #f3f4f6 30%, #ffffff 30%, #ffffff 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        columns: 2,
        gridGap: "32px",
        // Sidebar (narrow column) + empty content slot (wide column) — the
        // merchant fills in the right column with any blocks they want.
        // AI agents can rewrite either column without touching the wrapper.
        content: [
          {
            type: "Sidebar",
            props: {
              title: { ar: "القائمة الجانبية", en: "Sidebar" },
              showTitle: true,
              width: "narrow",
              stickyTop: "16px",
              borderStyle: "card",
              backgroundColor: "surface",
              showOnMobile: "collapse",
              items: [
                {
                  type: "Group",
                  props: {
                    direction: "column",
                    gap: 12,
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    wrap: "nowrap",
                    content: [
                      createContentLink("الرئيسية", { kind: "page", pageId: "/" }),
                      createContentLink("السلة", { kind: "page", pageId: "/cart" }),
                    ],
                  },
                },
              ],
            },
          },
          createStarterHeadingBlock("منطقة المحتوى الرئيسي"),
        ],
      },
    }),
  },

  // ── Elements — basic building blocks ────────────────────────────────────
  {
    kind: "section",
    id: "hero-band",
    label: "قسم هيرو",
    description:
      "قسم افتتاحي بعرض كامل — عنوان وفقرة وزر دعوة لاتخاذ إجراء فوق خلفية داكنة.",
    category: "elements",
    icon: <Sparkles size={20} />,
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
    build: () =>
      section({
        paddingTop: "96px",
        paddingBottom: "96px",
        backgroundColor: "#0f172a",
        theme: "dark",
        maxWidth: "100%",
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
                createHeading("عنوان جذاب لعرضك", {
                  textAlign: "center",
                  color: "theme-surface",
                  fontSize: "theme-2xl",
                  fontWeight: "theme-bold",
                }),
                createParagraph(
                  "نص مساند يوضّح قيمة عرضك ويدعو الزوار لاستكشاف المزيد.",
                  {
                    textAlign: "center",
                    fontSize: "theme-lg",
                    color: "theme-surface",
                  }
                ),
                createPrimaryButton("تسوق الآن", { align: "center" }),
              ],
            },
          },
        ],
      }),
  },
  {
    kind: "section",
    id: "rich-text",
    label: "نص منسق",
    description: "عنوان وفقرة في المنتصف.",
    category: "elements",
    icon: <TypeIcon size={20} />,
    gradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        maxWidth: "768px",
        paddingTop: "48px",
        paddingBottom: "48px",
        content: [
          createStarterHeadingBlock("احكِ قصة علامتك التجارية"),
          createStarterTextBlock(
            "استخدم هذا القسم لملاحظات الشحن أو قيم العلامة التجارية أو رسالة حملة قصيرة."
          ),
        ],
      },
    }),
  },
  {
    kind: "section",
    id: "faq-accordion",
    label: "أسئلة شائعة",
    description:
      "أسئلة وأجوبة قابلة للطي حول الشحن والإرجاع والدفع.",
    category: "elements",
    icon: <MessageSquareText size={20} />,
    gradient: "linear-gradient(135deg, #dbeafe 0%, #e0f2fe 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        maxWidth: "860px",
        content: [
          {
            type: "Accordion",
            props: {
              heading: "أسئلة شائعة",
              description: "أجب عن الأسئلة التي يطرحها المتسوقون قبل الشراء.",
              variant: "soft",
              items: [
                {
                  title: "كم تستغرق مدة التوصيل؟",
                  body: "عادةً ما تُجهّز الطلبات بسرعة وتُسلَّم وفق طريقة الشحن المختارة عند إتمام الطلب.",
                  open: true,
                },
                {
                  title: "هل يمكنني إرجاع منتج؟",
                  body: "نعم. اشرح هنا مدة الإرجاع المسموحة وشروط حالة المنتج.",
                  open: false,
                },
              ],
            },
          },
        ],
      },
    }),
  },
  {
    kind: "section",
    id: "image-gallery",
    label: "معرض صور",
    description: "شبكة صور — مثالية لعرض الإطلالات والمنتجات.",
    category: "elements",
    icon: <Images size={20} />,
    gradient: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #ddd6fe 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        content: [
          {
            type: "ImageGallery",
            props: {
              images: [
                {
                  src: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80",
                  alt: "واجهة المتجر",
                },
                {
                  src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
                  alt: "إطلالة منتج منسّقة",
                },
                {
                  src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
                  alt: "تفصيل نمط الحياة",
                },
              ],
              columns: 3,
              gap: "16px",
              radius: "16px",
            },
          },
        ],
      },
    }),
  },

  // ── Commerce (DSN-005 a-f) ──────────────────────────────────────────────
  {
    kind: "section",
    id: "products-grid",
    label: "شبكة المنتجات",
    description:
      "اختر مجموعة — تُجلب منتجاتها ويصبح كل منتج بطاقة قابلة للتحرير.",
    category: "commerce",
    icon: <Grid3x3 size={20} />,
    gradient: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
    configFields: [
      {
        type: "collection-picker",
        key: "collection",
        label: "اختر مجموعة",
        placeholder: "ابحث عن مجموعة…",
        required: true,
      },
    ],
    build: (params = {}) => {
      const collection = (params.collection as CollectionPickerRef | null) ?? null;
      const name = (params.collectionName as string) || collection?.name || "Products";

      return {
        type: "Section",
        props: {
          ...SECTION_BASE_PROPS,
          paddingTop: "48px",
          paddingBottom: "48px",
          name,
          columns: 1,
          columnsMobile: 1,
          gridGap: "24px",
          metadata: PRODUCTS_GRID_SECTION_METADATA,
          sectionKind: SECTION_KIND_PRODUCTS_GRID,
          collection,
          content: [],
        },
      };
    },
  },
  {
    kind: "section",
    id: "category-tree-products",
    label: "شجرة الفئات مع المنتجات",
    description:
      "قائمة فئات متداخلة — الضغط على أي فئة يعرض منتجاتها في الشبكة أسفلها.",
    category: "commerce",
    icon: <ListTree size={20} />,
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        name: "Category tree with products",
        paddingTop: "48px",
        paddingBottom: "48px",
        columns: 1,
        columnsMobile: 1,
        gridGap: "24px",
        content: [
          { type: "CategoryTree", props: {} },
          createProductsPageInnerSection(),
          {
            type: "ButtonGroup",
            props: {
              bindingMode: "pagination",
              gap: "theme-8",
              align: "center",
              ...CATEGORY_CHIP_STYLE,
              items: [],
            },
          },
        ],
      },
    }),
  },
  {
    kind: "section",
    id: "categories-list-products",
    label: "قائمة الفئات مع المنتجات",
    description:
      "أزرار فئات أفقية — الضغط على فئة يفلتر شبكة المنتجات أسفلها.",
    category: "commerce",
    icon: <Tags size={20} />,
    gradient: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        name: "Categories with products",
        paddingTop: "48px",
        paddingBottom: "48px",
        columns: 1,
        columnsMobile: 1,
        gridGap: "24px",
        content: [
          {
            type: "ButtonGroup",
            props: {
              bindingMode: "categories",
              prependAllButton: true,
              allButtonTitle: "الكل",
              gap: "theme-8",
              align: "center",
              ...CATEGORY_CHIP_STYLE,
              items: [],
            },
          },
          createProductsPageInnerSection(),
          {
            type: "ButtonGroup",
            props: {
              bindingMode: "pagination",
              gap: "theme-8",
              align: "center",
              ...CATEGORY_CHIP_STYLE,
              items: [],
            },
          },
        ],
      },
    }),
  },
  {
    kind: "section",
    id: "shopping-cart",
    label: "سلة التسوق",
    description:
      "صفوف السلة مع أزرار الكمية وزر إتمام الطلب.",
    category: "commerce",
    icon: <ShoppingCart size={20} />,
    gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    build: () => createCartSectionPreset(),
  },
  {
    kind: "section",
    id: "product-details",
    label: "تفاصيل المنتج",
    description:
      "صورة ومعلومات المنتج مرتبطة تلقائياً بالمنتج الحالي — السعر والوصف والسمات وزر الإضافة للسلة.",
    category: "commerce",
    icon: <IdCard size={20} />,
    gradient: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
    build: () => createProductDetailSection(),
  },
  {
    kind: "section",
    id: "orders-list",
    label: "قائمة الطلبات",
    description:
      "طلبات العميل الحالية مع الحالة وزر عرض التفاصيل — تُملأ تلقائياً من حساب الزائر.",
    category: "commerce",
    icon: <ClipboardList size={20} />,
    gradient: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)",
    build: () => createOrdersListSection(),
  },

  // IGNORED store blocks — do not re-add catalog presets for:
  // CategoryListMenu, OrderHistory, Wishlist, Testimonials, ContactForm.
  // (ProductImageCarousel / ProductVariants / ProductSearchMenu / CheckoutForm
  // likewise stay out of themes and presets — all legacy, see config/index.tsx.)
];

// ─── Zone presets (site-wide header/footer) ────────────────────────────────
// These replace `root:zone-header` / `root:zone-footer` instead of inserting
// into the current page's content — applying one affects every page.

const headerZonePresets: ZoneSectionPreset[] = HEADER_LAYOUT_OPTIONS.map(
  (option) => ({
    kind: "zone",
    id: option.id,
    label: option.title,
    description: `${option.description} — يُطبَّق على رأس الموقع بالكامل.`,
    category: "elements",
    icon: <PanelTop size={20} />,
    gradient: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    zoneTarget: "header",
    preset: headerLayoutOptionToPreset(option),
  })
);

const FOOTER_PRESET_DESCRIPTIONS: Record<string, string> = {
  "footer-commerce-full": "تذييل بثلاثة أعمدة روابط مع نص تعريفي — الأنسب للمتاجر الكبيرة.",
  "footer-default-classic": "تذييل كلاسيكي بعمودي روابط ووصف موجز عن المتجر.",
  "footer-commerce-minimal": "تذييل مبسّط بعمودي روابط فقط — للمتاجر الصغيرة.",
};

const footerZonePresets: ZoneSectionPreset[] = ZONE_FOOTER_PRESETS.map(
  (preset) => ({
    kind: "zone",
    id: preset.id,
    label: preset.title,
    description: `${FOOTER_PRESET_DESCRIPTIONS[preset.id] ?? preset.title} يُطبَّق على تذييل الموقع بالكامل.`,
    category: "elements",
    icon: <PanelBottom size={20} />,
    gradient: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
    zoneTarget: "footer",
    preset,
  })
);

export const zoneSectionCatalog: ZoneSectionPreset[] = [
  ...headerZonePresets,
  ...footerZonePresets,
];

export const CATEGORY_LABELS: Record<SectionCategory, string> = {
  layout: "تخطيط",
  elements: "العناصر الأساسية",
  commerce: "المتجر",
};

export const CATEGORY_ORDER: SectionCategory[] = [
  "layout",
  "elements",
  "commerce",
];

/**
 * Ensure inserting a preset doesn't leak editor-only state: the returned
 * payload must be safely JSON.stringify-able. Used as a dev-time guard by
 * the Add Section modal to catch misconfigured presets.
 */
export function assertSerializable(preset: SectionPreset): void {
  const built = preset.build();
  try {
    JSON.parse(JSON.stringify(built));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(
      `[shopify-editor] Section preset "${preset.id}" is not JSON-serializable`,
      e
    );
    throw e;
  }
}

// Re-export Data for convenience of consumers that want to type-narrow
// dispatched payloads against the user's Config.
export type { Data };
