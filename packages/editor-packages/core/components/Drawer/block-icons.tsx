import {
  AlignRight,
  Columns2,
  CreditCard,
  GalleryHorizontal,
  Heading,
  Heart,
  History,
  Image,
  Images,
  Layers,
  LayoutGrid,
  LayoutPanelTop,
  Link,
  List,
  ListCollapse,
  Mail,
  Minus,
  MoveVertical,
  RectangleHorizontal,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  SquareStack,
  Star,
  TextCursorInput,
  Video,
  type LucideIcon,
} from "lucide-react";

/**
 * Colored avatar (icon + category tint) for each block in the palette.
 * The four color families match the properties-panel tab colors so both
 * sidebars speak one visual language:
 *   sky = تخطيط · violet = عناصر · teal = المتجر · amber = العميل
 */

type BlockIconCategory = "layout" | "element" | "store" | "customer";

const CATEGORY_COLORS: Record<
  BlockIconCategory,
  { color: string; tint: string }
> = {
  layout: { color: "#0284c7", tint: "#eaf5fd" },
  element: { color: "#7c3aed", tint: "#f3eefe" },
  store: { color: "#0d9488", tint: "#e7f7f4" },
  customer: { color: "#b45309", tint: "#fdf3e4" },
};

const BLOCK_ICONS: Record<
  string,
  { icon: LucideIcon; category: BlockIconCategory }
> = {
  // تخطيط
  Section: { icon: LayoutPanelTop, category: "layout" },
  Group: { icon: Layers, category: "layout" },
  RowGroup: { icon: Columns2, category: "layout" },
  // عناصر
  ContentHeading: { icon: Heading, category: "element" },
  ContentParagraph: { icon: AlignRight, category: "element" },
  ContentImage: { icon: Image, category: "element" },
  ContentButton: { icon: RectangleHorizontal, category: "element" },
  ButtonGroup: { icon: SquareStack, category: "element" },
  ContentLink: { icon: Link, category: "element" },
  ContentInput: { icon: TextCursorInput, category: "element" },
  ContentDivider: { icon: Minus, category: "element" },
  Space: { icon: MoveVertical, category: "element" },
  ImageGallery: { icon: Images, category: "element" },
  VideoEmbed: { icon: Video, category: "element" },
  Accordion: { icon: ListCollapse, category: "element" },
  // المتجر
  ProductImageCarousel: { icon: GalleryHorizontal, category: "store" },
  ProductVariants: { icon: SlidersHorizontal, category: "store" },
  CategoryListMenu: { icon: List, category: "store" },
  CheckoutForm: { icon: CreditCard, category: "store" },
  ProductSearchMenu: { icon: Search, category: "store" },
  ProductsGrid: { icon: LayoutGrid, category: "store" },
  CartSection: { icon: ShoppingCart, category: "store" },
  // العميل
  OrderHistory: { icon: History, category: "customer" },
  Wishlist: { icon: Heart, category: "customer" },
  Testimonials: { icon: Star, category: "customer" },
  ContactForm: { icon: Mail, category: "customer" },
};

const FALLBACK = { icon: SquareStack, category: "element" as const };

export const BlockAvatar = ({ name }: { name: string }) => {
  const { icon: Icon, category } = BLOCK_ICONS[name] ?? FALLBACK;
  const { color, tint } = CATEGORY_COLORS[category];

  return (
    <span
      aria-hidden
      style={{
        display: "grid",
        placeItems: "center",
        width: 30,
        height: 30,
        flexShrink: 0,
        borderRadius: 9,
        color,
        background: tint,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 22%, transparent)`,
      }}
    >
      <Icon size={15} />
    </span>
  );
};
