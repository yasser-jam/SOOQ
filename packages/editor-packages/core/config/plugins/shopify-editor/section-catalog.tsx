import React from "react";
import {
  LayoutTemplate,
  ShoppingBag,
  Sparkles,
  ShoppingCart,
  MessageSquareText,
  Star,
  Mail,
  UserRound,
  Heart,
  Images,
  Grid3x3,
  Type as TypeIcon,
  Columns2,
  Rows2,
  PanelLeft,
  Menu as MenuIcon,
} from "lucide-react";
import type { Data } from "@/core";
import {
  DEFAULT_SECTION_NAME,
  createStarterHeadingBlock,
  createStarterTextBlock,
  createSectionStarterContent,
} from "../../blocks/Section/starter-data";
import { createCartSectionPreset } from "../../presets/cart";
import { SECTION_KIND_PRODUCTS_GRID, PRODUCTS_GRID_SECTION_METADATA } from "../../blocks/Section/products-grid-section";
import type { CollectionPickerRef } from "@/modules/product/collection/data-store";

/**
 * Shopify-style Section Catalog.
 *
 * Each entry is a "preset" that can be inserted from the Add Section modal.
 * A preset produces a fully-formed, JSON-serializable payload (type + props,
 * including any nested slot content) that the editor dispatches via the
 * reducer. **All state persists to `store_config.json`** — there is no hidden
 * editor-only state attached to a section.
 *
 * Categories mirror SRS § 4.2 taxonomy:
 *   - hero:     large marketing bands, page openers
 *   - commerce: DSN-005 a-f bound-to-tenant-data blocks
 *   - customer: DSN-005 g-j customer-account-surface blocks
 *   - content:  DSN-004 a-j generic text/media blocks
 *   - layout:   columns / grids / groups
 */

export type SectionCategory =
  | "hero"
  | "commerce"
  | "customer"
  | "content"
  | "layout";

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

const categoryMenuBlock = () => ({
  type: "CategoryListMenu",
  props: {
    buttonLabel: "Browse categories",
    categoriesMenuTitle: "Shop by category",
    backLabel: "Back to categories",
    maxProducts: 24,
  },
});

const orderHistoryBlock = () => ({
  type: "OrderHistory",
  props: {
    limit: 5,
    currency: "SYP",
    statusFilter: "all",
    showThumbnails: true,
    emptyStateText: "You have no orders yet.",
  },
});

const wishlistBlock = () => ({
  type: "Wishlist",
  props: {
    columns: 3,
    gap: "md",
    currency: "SYP",
    showAddToCart: true,
    ctaLabel: "Add to cart",
    emptyStateText: "Your wishlist is empty.",
  },
});

const contactFormBlock = () => ({
  type: "ContactForm",
  props: {
    title: { ar: "تواصل معنا", en: "Get in touch" },
    subtitle: {
      ar: "سنرد خلال يوم عمل واحد.",
      en: "We'll reply within one business day.",
    },
    language: "ar",
    showPhone: true,
    requirePhone: false,
    showSubject: true,
    submitLabel: "إرسال",
    successMessage: "شكراً — تم إرسال رسالتك.",
    enableCaptcha: true,
    submitWidth: "auto",
  },
});

// ─── Catalog entries ────────────────────────────────────────────────────────

export const sectionCatalog: SectionPreset[] = [
  // ── Hero / Opener ────────────────────────────────────────────────────────
  {
    id: "empty-section",
    label: "Starter Section",
    description: "Starter section with heading, paragraph and CTA.",
    category: "layout",
    icon: <LayoutTemplate size={20} />,
    gradient: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)",
    build: () => section(),
  },
  {
    id: "hero-band",
    label: "Hero Band",
    description: "Full-width hero with dark background, generous padding.",
    category: "hero",
    icon: <Sparkles size={20} />,
    gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)",
    build: () =>
      section({
        paddingTop: "96px",
        paddingBottom: "96px",
        backgroundColor: "#0f172a",
        theme: "dark",
        maxWidth: "100%",
      }),
  },
  {
    id: "narrow-content",
    label: "Narrow Content",
    description: "Centred column for prose — good for About, Policy pages.",
    category: "content",
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
    id: "two-column",
    label: "Two-column Layout",
    description: "Split content into two equal columns.",
    category: "layout",
    icon: <Columns2 size={20} />,
    gradient:
      "linear-gradient(90deg, #eff6ff 0%, #eff6ff 50%, #f0fdf4 50%, #f0fdf4 100%)",
    build: () => section({ columns: 2, gridGap: "32px" }),
  },
  {
    id: "content-with-sidebar",
    label: "Content with Sidebar",
    description:
      "Two-column layout: main content on one side, a Sidebar for filters or nav on the other.",
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
                        label: { ar: "السلة", en: "Cart" },
                        link: { kind: "page", pageId: "/cart" },
                      },
                    ],
                  },
                },
              ],
            },
          },
          createStarterHeadingBlock("Sidebar content area"),
        ],
      },
    }),
  },
  {
    id: "site-nav-header",
    label: "Site Navigation",
    description:
      "Horizontal NavMenu — ideal for a header band. Links to registered pages.",
    category: "layout",
    icon: <MenuIcon size={20} />,
    gradient: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        paddingTop: "16px",
        paddingBottom: "16px",
        content: [
          {
            type: "NavMenu",
            props: {
              orientation: "horizontal",
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
        ],
      },
    }),
  },

  // ── Commerce (DSN-005 a-f) ──────────────────────────────────────────────
  {
    id: "products-grid",
    label: "Products Grid",
    description:
      "Choose a collection — products are fetched and each one becomes a bound, editable product card.",
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
    id: "shopping-cart",
    label: "Shopping Cart",
    description:
      "Cart rows from localStorage (store-cart) with quantity controls and order button.",
    category: "commerce",
    icon: <ShoppingCart size={20} />,
    gradient: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
    build: () => createCartSectionPreset(),
  },
  {
    id: "category-list",
    label: "Category Menu",
    description: "Clickable list of top-level product categories.",
    category: "commerce",
    icon: <ShoppingBag size={20} />,
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        content: [
          categoryMenuBlock(),
        ],
      },
    }),
  },

  // ── Customer (DSN-005 g-j) ──────────────────────────────────────────────
  {
    id: "order-history",
    label: "Order History",
    description: "Customer account — recent orders with status.",
    category: "customer",
    icon: <UserRound size={20} />,
    gradient: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        maxWidth: "960px",
        content: [
          orderHistoryBlock(),
        ],
      },
    }),
  },
  {
    id: "wishlist",
    label: "Wishlist",
    description: "Customer's saved products in a responsive grid.",
    category: "customer",
    icon: <Heart size={20} />,
    gradient: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        content: [
          wishlistBlock(),
        ],
      },
    }),
  },
  {
    id: "testimonials",
    label: "Testimonials",
    description: "Customer reviews — bilingual AR / EN supported.",
    category: "customer",
    icon: <Star size={20} />,
    gradient: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        paddingTop: "80px",
        paddingBottom: "80px",
        backgroundColor: "#fafafa",
        content: [
          {
            type: "Testimonials",
            props: {
              source: "inline",
              layoutVariant: "grid",
              columns: 3,
              language: "ar",
              showRating: true,
              showAvatars: true,
              itemCount: 3,
            },
          },
        ],
      },
    }),
  },
  {
    id: "contact-form",
    label: "Contact Form",
    description: "Collect inquiries. Submits to tenant endpoint.",
    category: "customer",
    icon: <Mail size={20} />,
    gradient: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        maxWidth: "768px",
        content: [
          contactFormBlock(),
        ],
      },
    }),
  },

  // ── Content (DSN-004) ────────────────────────────────────────────────────
  {
    id: "rich-text",
    label: "Rich Text",
    description: "Headline + paragraph, centred.",
    category: "content",
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
          createStarterHeadingBlock("Tell your brand story"),
          createStarterTextBlock(
            "Use this section for shipping notes, brand values, product care, or a short campaign message."
          ),
        ],
      },
    }),
  },
  {
    id: "faq-accordion",
    label: "FAQ Accordion",
    description:
      "Expandable questions and answers for shipping, returns, and payments.",
    category: "content",
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
              heading: "Frequently asked questions",
              description:
                "Answer the questions shoppers ask before they buy.",
              variant: "soft",
              items: [
                {
                  title: "How long does delivery take?",
                  body: "Most orders are prepared quickly and delivered according to the shipping method selected at checkout.",
                  open: true,
                },
                {
                  title: "Can I return an item?",
                  body: "Yes. Explain your return window and any product conditions here.",
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
    id: "image-gallery",
    label: "Image Gallery",
    description: "Grid of images — great for lookbooks.",
    category: "content",
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
                  alt: "Store display",
                },
                {
                  src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
                  alt: "Styled product look",
                },
                {
                  src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=80",
                  alt: "Lifestyle detail",
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
  {
    id: "testimonial-quote",
    label: "Quote",
    description: "Single large testimonial / pull-quote.",
    category: "content",
    icon: <MessageSquareText size={20} />,
    gradient: "linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)",
    build: () => ({
      type: "Section",
      props: {
        ...SECTION_BASE_PROPS,
        maxWidth: "768px",
        paddingTop: "80px",
        paddingBottom: "80px",
        backgroundColor: "#fafafa",
        content: [
          {
            type: "Testimonials",
            props: {
              itemCount: 1,
              layoutVariant: "minimal",
            },
          },
        ],
      },
    }),
  },
];

export const CATEGORY_LABELS: Record<SectionCategory, string> = {
  hero: "Hero & Openers",
  commerce: "Commerce",
  customer: "Customer",
  content: "Content",
  layout: "Layout",
};

export const CATEGORY_ORDER: SectionCategory[] = [
  "hero",
  "commerce",
  "customer",
  "content",
  "layout",
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
