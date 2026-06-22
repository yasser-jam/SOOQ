import { Button } from "./blocks/Button";
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
import { ContentButton } from "./blocks/ContentButton";
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
import Root from "./root";
import { UserConfig } from "./types";

const conf: UserConfig = {
  root: Root,
  categories: {
    shell: {
      title: "هيكل",
      defaultExpanded: true,
      components: ["SiteHeader", "SiteDrawerShell", "SiteFooter"],
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
        "ContentButton",
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
      components: ["Group", "Sidebar", "NavMenu"],
    },
    legacy: {
      title: "إصدار سابق (مخفي)",
      visible: false,
      components: [
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
      ],
    },
  },
  components: {
    SiteHeader,
    SiteDrawerShell,
    SiteFooter,
    Section,
    Group,
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
    ContentButton,
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
    NavMenu,
    SideDrawer,
  },
};

export default conf;
