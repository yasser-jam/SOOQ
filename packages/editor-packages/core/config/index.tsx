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
import { ProductsGrid } from "./blocks/ProductsGrid";
import { ProductImageCarousel } from "./blocks/ProductImageCarousel";
import { ProductVariants } from "./blocks/ProductVariants";
import { CartSection } from "./blocks/CartSection";
import { CartList } from "./blocks/CartList";
import { CartItem } from "./blocks/CartItem";
import { CartQuantity } from "./blocks/CartQuantity";
import { CartIconButton } from "./blocks/CartIconButton";
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
import { initialData } from "./initial-data";

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
        "ProductImageCarousel",
        "ProductVariants",
        "CategoryListMenu",
        "CartSection",
        "CartList",
        "CartItem",
        "CartQuantity",
        "CheckoutForm",
        "ProductSearchMenu",
        "CartIconButton",
        "OrderHistory",
        "Wishlist",
        "Testimonials",
        "ContactForm",
      ],
    },
    legacy: {
      title: "إصدار سابق (مخفي)",
      visible: false,
      components: [
        // ProductsGrid uses SlotRenderPure (non-editable cards) — insert via
        // the "Products Grid" section preset instead, which also sets the
        // collection picker.
        "ProductsGrid",
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
  },
  components: {
    // Zone / shell components
    SiteHeader,
    SiteFooter,
    ZoneDrawer,
    ZonePopup,
    ZoneBottomSheet,
    SiteDrawerShell,
    // Sections
    Section,
    // Group / Layout
    Group,
    RowGroup,
    // Bound — commerce
    ProductsGrid,
    ProductCard,
    ProductImageCarousel,
    ProductVariants,
    CategoryListMenu,
    CartSection,
    CartList,
    CartItem,
    CartQuantity,
    CartIconButton,
    CheckoutForm,
    ProductSearchMenu,
    ProductImage,
    ProductInfo,
    // Bound — customer (newly added: DSN-005 g/h/i/j)
    OrderHistory,
    Wishlist,
    Testimonials,
    ContactForm,
    // Content (DSN-004 a–j)
    ContentHeading,
    ContentParagraph,
    Accordion,
    ContentImage,
    ContentButton,
    ContentInput,
    ContentDivider,
    Space,
    ImageGallery,
    VideoEmbed,
    ContentIcon,
    ContentHtml,
    // Layout containers (DSN-004k–n)
    Sidebar,
    NavMenu,
    SideDrawer,
    // Legacy — kept registered so existing store_config.json can still render,
    // but hidden from the picker (see categories.legacy.visible = false).
    Button,
    Card,
    Grid,
    Hero,
    Heading,
    Flex,
    Logos,
    Stats,
    Template,
    Text,
    RichText,
  },
};

export const componentKey = Buffer.from(
  `${Object.keys(conf.components).join("-")}-${JSON.stringify(initialData)}`
).toString("base64");

export default conf;
