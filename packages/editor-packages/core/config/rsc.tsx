// RSC-friendly config that excludes blocks requiring client-only utilities
import { Card } from "./blocks/Card";
import { Grid } from "./blocks/Grid";
import { Hero } from "./blocks/Hero/server";
import { Heading } from "./blocks/Heading";
import { Flex } from "./blocks/Flex";
import { Logos } from "./blocks/Logos";
import { Stats } from "./blocks/Stats";
import { Template } from "./blocks/Template/server";
import { Text } from "./blocks/Text";
import { Space } from "./blocks/Space";
import { RichText } from "./blocks/RichText";
import { ProductCard } from "./blocks/ProductCard";
import { ProductsGrid } from "./blocks/ProductsGrid";
import { CartSection } from "./blocks/CartSection";
import { CheckoutForm } from "./blocks/CheckoutForm";
import { ProductSearchMenu } from "./blocks/ProductSearchMenu";
import { CategoryListMenu } from "./blocks/CategoryListMenu";
import { ProductImage } from "./blocks/ProductImage";
import { ProductInfo } from "./blocks/ProductInfo";
import { Section } from "./blocks/Section";
import { Group } from "./blocks/Group";
import { ContentHeading } from "./blocks/ContentHeading";
import { ContentParagraph } from "./blocks/ContentParagraph";
import { Accordion } from "./blocks/Accordion";
import { ContentImage } from "./blocks/ContentImage";
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
import Root from "./root";
import { UserConfig } from "./types";

// Create empty stubs for components that require client-only utilities
// These are included for type compatibility but won't be used in RSC rendering
const createEmptyComponent = (label: string) => ({
  label,
  defaultProps: {},
  render: () => <div />,
});

// RSC-compatible config without blocks that use linkField
const rscConf = {
  root: Root,
  categories: {
    shell: {
      title: "هيكل",
      defaultExpanded: false,
      visible: false,
      components: [],
    },
    sections: {
      title: "أقسام",
      defaultExpanded: true,
      components: ["Section"],
    },
    bound: {
      title: "عناصر المتجر",
      defaultExpanded: true,
      components: [
        "ProductsGrid",
        "ProductCard",
        "CategoryListMenu",
        "CartSection",
        "CheckoutForm",
        "ProductSearchMenu",
        "OrderHistory",
        "Wishlist",
        "Testimonials",
        "ContactForm",
        "ProductImage",
        "ProductInfo",
      ],
    },
    content: {
      title: "محتوى",
      defaultExpanded: true,
      components: [
        "ContentHeading",
        "ContentParagraph",
        "Accordion",
        "ContentImage",
        "ContentDivider",
        "Space",
        "ImageGallery",
        "VideoEmbed",
        "ContentIcon",
        "ContentHtml",
      ],
    },
    group: {
      title: "تخطيط",
      defaultExpanded: true,
      components: ["Group", "Sidebar"],
    },
    legacy: {
      title: "إصدار سابق (مخفي)",
      visible: false,
      components: [
        "Heading",
        "Text",
        "RichText",
        "Card",
        "Grid",
        "Flex",
        "Hero",
        "Logos",
        "Stats",
        "Template",
      ],
    },
  },
  components: {
    Section,
    Group,
    Card,
    Grid,
    Hero,
    Heading,
    Flex,
    Logos,
    Stats,
    Template,
    Text,
    Space,
    RichText,
    ProductCard,
    ProductsGrid,
    CartSection,
    CheckoutForm,
    ProductSearchMenu,
    CategoryListMenu,
    ProductImage,
    ProductInfo,
    ContentHeading,
    ContentParagraph,
    Accordion,
    ContentImage,
    ContentDivider,
    ImageGallery,
    VideoEmbed,
    ContentIcon,
    ContentHtml,
    OrderHistory,
    Wishlist,
    Testimonials,
    ContactForm,
    Sidebar,
    // Stubs for components that require client-only utilities
    SiteHeader: createEmptyComponent("رأس الموقع"),
    SiteDrawerShell: createEmptyComponent("درج جانبي"),
    SiteFooter: createEmptyComponent("تذييل الموقع"),
    Button: createEmptyComponent("زر"),
    ContentButton: createEmptyComponent("زر"),
    NavMenu: createEmptyComponent("قائمة التنقل"),
    SideDrawer: createEmptyComponent("درج جانبي"),
  },
};


// Type cast to bypass TypeScript checks for stub components
export default rscConf as any;
