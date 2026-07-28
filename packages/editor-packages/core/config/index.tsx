import { Button } from "./blocks/Button";
import { Card } from "./blocks/Card";
import { Grid } from "./blocks/Grid";
import { Hero } from "./blocks/Hero";
import { Heading } from "./blocks/Heading";
import { Flex } from "./blocks/Flex";
import { Logos } from "./blocks/Logos";
import { Stats } from "./blocks/Stats";
import { Template } from "./blocks/Template";
import { Text } from "./blocks/Text";
import { Space } from "./blocks/Space";
import { RichText } from "./blocks/RichText";
import { ProductCard } from "./blocks/ProductCard";
import { ProductImageCarousel } from "./blocks/ProductImageCarousel";
import { ProductVariants } from "./blocks/ProductVariants";
import { CartSection } from "./blocks/CartSection";
import { CartList } from "./blocks/CartList";
import { CartItem } from "./blocks/CartItem";
import { CartQuantity } from "./blocks/CartQuantity";
import { CartIconButton } from "./blocks/CartIconButton";
import { OrdersIconButton } from "./blocks/OrdersIconButton";
import { CheckoutForm } from "./blocks/CheckoutForm";
import { ProductSearchMenu } from "./blocks/ProductSearchMenu";
import { CategoryListMenu } from "./blocks/CategoryListMenu";
import { ProductImage } from "./blocks/ProductImage";
import { ProductInfo } from "./blocks/ProductInfo";
import { Section } from "./blocks/Section";
import { Group } from "./blocks/Group";
import { RowGroup } from "./blocks/RowGroup";
import { ContentHeading } from "./blocks/ContentHeading";
import { ContentParagraph } from "./blocks/ContentParagraph";
import { Accordion } from "./blocks/Accordion";
import { ContentImage } from "./blocks/ContentImage";
import { ContentButton } from "./blocks/ContentButton";
import { Chip } from "./blocks/Chip";
import { ButtonGroup } from "./blocks/ButtonGroup";
import { ContentLink } from "./blocks/ContentLink";
import { ContentInput } from "./blocks/ContentInput";
import { ContentDivider } from "./blocks/ContentDivider";
import { ImageGallery } from "./blocks/ImageGallery";
import { VideoEmbed } from "./blocks/VideoEmbed";
import { ContentIcon } from "./blocks/ContentIcon";
import { ContentHtml } from "./blocks/ContentHtml";
import { OrderHistory } from "./blocks/OrderHistory";
import { Wishlist } from "./blocks/Wishlist";
import { Testimonials } from "./blocks/Testimonials";
import { ContactForm } from "./blocks/ContactForm";
import { Sidebar } from "./blocks/Sidebar";
import { NavMenu } from "./blocks/NavMenu";
import { SideDrawer } from "./blocks/SideDrawer";
import { SiteHeader } from "./blocks/SiteHeader";
import { SiteDrawerShell } from "./blocks/SiteDrawerShell";
import { SiteFooter } from "./blocks/SiteFooter";
import { ZoneDrawer } from "./blocks/ZoneDrawer";
import { ZonePopup } from "./blocks/ZonePopup";
import { ZoneBottomSheet } from "./blocks/ZoneBottomSheet";

import Root from "./root";
import { UserConfig } from "./types";
import { withShowCondition } from "./lib/with-show-condition";

// Categories follow SRS § 4.2 taxonomy:
//   - Sections   → DSN-003 page-level bands
//   - Bound      → DSN-005 a–j data-bound blocks (commerce, customer)
//   - Content    → DSN-004 a–j Generic blocks (data-agnostic)
//   - Group      → DSN-006 / DSN-004k layout containers
//   - Legacy     → kept hidden; preserved so old store_config.json still loads
//
// Block IDs in order roughly mirror the SRS sub-spec ordering so an AI agent
// scanning the config can map to requirement IDs predictably.
export const conf: UserConfig = {
  root: Root,
  categories: {
    layout: {
      title: "تخطيط",
      defaultExpanded: true,
      components: [
        "Section",
        "Group",
        "RowGroup",
      ],
    },
    blocks: {
      title: "عناصر",
      defaultExpanded: true,
      components: [
        "ContentHeading",
        "ContentParagraph",
        "ContentImage",
        "ContentButton",
        "Chip",
        "ButtonGroup",
        "ContentLink",
        "ContentInput",
        "ContentDivider",
        "Space",
        "ImageGallery",
        "VideoEmbed",
        "Accordion",
      ],
    },
    storeBlocks: {
      title: "عناصر المتجر",
      defaultExpanded: true,
      components: [
        // "ProductImageCarousel", // IGNORED
        // "ProductVariants",      // IGNORED
        // "CategoryListMenu",     // IGNORED
        // "CheckoutForm",         // IGNORED
        // "ProductSearchMenu",    // IGNORED
        // "OrderHistory",         // IGNORED
        // "Wishlist",             // IGNORED
        "OrdersIconButton",
        "Testimonials",
        // "ContactForm",          // IGNORED
      ],
    },
    legacy: {
      title: "إصدار سابق (مخفي)",
      visible: false,
      components: [
        // Cart — use Shopping Cart section preset (Section + Group) instead.
        "CartSection",
        "CartList",
        "CartItem",
        "CartQuantity",
        "CartIconButton",
        // ProductCard alias — old configs; insert product cards as Group + product picker.
        "ProductCard",
        // Legacy drawer shell — use ZoneDrawer for new stores.
        "SiteDrawerShell",
        "SideDrawer",
        "Heading",
        "Text",
        "RichText",
        "Button",
        "Card",
        "Grid",
        "Flex",
        "Hero",
        "Logos",
        "Stats",
        "Template",
        "NavMenu",
        "ContentIcon",
        "ContentHtml",
        // Product detail page primitives - kept for backward compatibility
        "ProductImage",
        "ProductInfo",
      ],
    },
    other: {
      visible: false,
    },
  },
  components: {
    // Zone / shell components
    SiteHeader: withShowCondition(SiteHeader),
    SiteFooter: withShowCondition(SiteFooter),
    ZoneDrawer: withShowCondition(ZoneDrawer),
    ZonePopup: withShowCondition(ZonePopup),
    ZoneBottomSheet: withShowCondition(ZoneBottomSheet),
    SiteDrawerShell: withShowCondition(SiteDrawerShell),
    // Sections
    Section: withShowCondition(Section),
    // Group / Layout
    Group: withShowCondition(Group),
    RowGroup: withShowCondition(RowGroup),
    // Bound — commerce
    ProductCard: withShowCondition(ProductCard),
    ProductImageCarousel: withShowCondition(ProductImageCarousel),
    ProductVariants: withShowCondition(ProductVariants),
    CategoryListMenu: withShowCondition(CategoryListMenu),
    CheckoutForm: withShowCondition(CheckoutForm),
    ProductSearchMenu: withShowCondition(ProductSearchMenu),
    ProductImage: withShowCondition(ProductImage),
    ProductInfo: withShowCondition(ProductInfo),
    // Bound — customer (newly added: DSN-005 g/h/i/j)
    OrderHistory: withShowCondition(OrderHistory),
    Wishlist: withShowCondition(Wishlist),
    Testimonials: withShowCondition(Testimonials),
    ContactForm: withShowCondition(ContactForm),
    // Legacy cart blocks — old store_config.json only
    CartSection: withShowCondition(CartSection),
    CartList: withShowCondition(CartList),
    CartItem: withShowCondition(CartItem),
    CartQuantity: withShowCondition(CartQuantity),
    CartIconButton: withShowCondition(CartIconButton),
    // Customer account entry points (real apps/store routes, not Site JSON pages)
    OrdersIconButton: withShowCondition(OrdersIconButton),
    // Content (DSN-004 a–j)
    ContentHeading: withShowCondition(ContentHeading),
    ContentParagraph: withShowCondition(ContentParagraph),
    Accordion: withShowCondition(Accordion),
    ContentImage: withShowCondition(ContentImage),
    ContentButton: withShowCondition(ContentButton),
    Chip: withShowCondition(Chip),
    ButtonGroup: withShowCondition(ButtonGroup),
    ContentLink: withShowCondition(ContentLink),
    ContentInput: withShowCondition(ContentInput),
    ContentDivider: withShowCondition(ContentDivider),
    Space: withShowCondition(Space),
    ImageGallery: withShowCondition(ImageGallery),
    VideoEmbed: withShowCondition(VideoEmbed),
    ContentIcon: withShowCondition(ContentIcon),
    ContentHtml: withShowCondition(ContentHtml),
    // Layout containers (DSN-004k–n)
    Sidebar: withShowCondition(Sidebar),
    NavMenu: withShowCondition(NavMenu),
    SideDrawer: withShowCondition(SideDrawer),
    // Legacy — kept registered so existing store_config.json can still render,
    // but hidden from the picker (see categories.legacy.visible = false).
    Button: withShowCondition(Button),
    Card: withShowCondition(Card),
    Grid: withShowCondition(Grid),
    Hero: withShowCondition(Hero),
    Heading: withShowCondition(Heading),
    Flex: withShowCondition(Flex),
    Logos: withShowCondition(Logos),
    Stats: withShowCondition(Stats),
    Template: withShowCondition(Template),
    Text: withShowCondition(Text),
    RichText: withShowCondition(RichText),
  },
};

// Was previously a ~50 KB base64 of the whole initialData computed with Node's
// `Buffer` at module load — which dragged the Buffer polyfill into every client
// bundle and made every localStorage lookup hash a 50 KB key.
// `site-data.ts` migrates payloads saved under the old key on first read.
export { componentKey } from "./component-key";

export default conf;
