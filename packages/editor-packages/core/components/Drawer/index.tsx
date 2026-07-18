"use client";
import styles from "./styles.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { DragIcon } from "../DragIcon";
import {
  Component,
  type CSSProperties,
  createElement,
  type ErrorInfo,
  ReactElement,
  ReactNode,
  Ref,
  useMemo,
  useState,
} from "react";
import { generateId } from "../../lib/generate-id";
import { useDragListener } from "../DragDropContext";
import { useSafeId } from "../../lib/use-safe-id";
import { useDraggable, useDroppable } from "@dnd-kit/react";
import { useAppStore } from "../../store";
import type { Field, PuckContext } from "../../types";
import { BlockAvatar } from "./block-icons";
const getClassName = getClassNameFactory("Drawer", styles);
const getClassNameItem = getClassNameFactory("DrawerItem", styles);

const PREVIEW_COLOR_PALETTES = [
  { bg: "#eff6ff", accent: "#2563eb", text: "#1e3a8a" },
  { bg: "#ecfeff", accent: "#0e7490", text: "#155e75" },
  { bg: "#f0fdf4", accent: "#16a34a", text: "#166534" },
  { bg: "#fff7ed", accent: "#ea580c", text: "#9a3412" },
  { bg: "#faf5ff", accent: "#9333ea", text: "#6b21a8" },
  { bg: "#f8fafc", accent: "#334155", text: "#0f172a" },
] as const;

type PreviewPalette = (typeof PREVIEW_COLOR_PALETTES)[number];

type PreviewKind =
  | "heading"
  | "paragraph"
  | "richText"
  | "button"
  | "image"
  | "imageGallery"
  | "video"
  | "divider"
  | "icon"
  | "html"
  | "accordion"
  | "section"
  | "layoutGrid"
  | "layoutFlex"
  | "sidebar"
  | "nav"
  | "productsGrid"
  | "productCard"
  | "cart"
  | "checkout"
  | "searchMenu"
  | "categoryMenu"
  | "productInfo"
  | "orderHistory"
  | "wishlist"
  | "testimonials"
  | "contactForm"
  | "header"
  | "footer"
  | "drawerShell"
  | "hero"
  | "stats"
  | "logos"
  | "template"
  | "space"
  | "unknown";

const escapeSvgText = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getPreviewPalette = (value: string) => {
  let hash = 0;

  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }

  return PREVIEW_COLOR_PALETTES[hash % PREVIEW_COLOR_PALETTES.length];
};

const roundedRect = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke?: string,
  radius: number = 6
) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}"${
    stroke ? ` stroke="${stroke}"` : ""
  }/>`;

const line = (
  x: number,
  y: number,
  width: number,
  fill: string = "#e2e8f0",
  height: number = 8
) => roundedRect(x, y, width, height, fill, undefined, Math.max(3, height / 2));

const getPreviewKind = (componentType: string): PreviewKind => {
  switch (componentType) {
    case "Heading":
    case "ContentHeading":
      return "heading";
    case "Text":
    case "ContentParagraph":
      return "paragraph";
    case "RichText":
      return "richText";
    case "Button":
    case "ContentButton":
    case "ContentLink":
      return "button";
    case "ContentImage":
    case "ProductImage":
      return "image";
    case "ImageGallery":
      return "imageGallery";
    case "VideoEmbed":
      return "video";
    case "ContentDivider":
      return "divider";
    case "ContentIcon":
      return "icon";
    case "ContentHtml":
      return "html";
    case "Accordion":
      return "accordion";
    case "Section":
      return "section";
    case "Grid":
    case "Group":
      return "layoutGrid";
    case "Flex":
      return "layoutFlex";
    case "Sidebar":
      return "sidebar";
    case "NavMenu":
      return "nav";
    case "ProductCard":
    case "Card":
      return "productCard";
    case "CartSection":
      return "cart";
    case "CheckoutForm":
      return "checkout";
    case "ProductSearchMenu":
      return "searchMenu";
    case "CategoryListMenu":
      return "categoryMenu";
    case "ProductInfo":
      return "productInfo";
    case "OrderHistory":
      return "orderHistory";
    case "Wishlist":
      return "wishlist";
    case "Testimonials":
      return "testimonials";
    case "ContactForm":
      return "contactForm";
    case "SiteHeader":
      return "header";
    case "SiteFooter":
      return "footer";
    case "SiteDrawerShell":
    case "SideDrawer":
      return "drawerShell";
    case "Hero":
      return "hero";
    case "Stats":
      return "stats";
    case "Logos":
      return "logos";
    case "Template":
      return "template";
    case "Space":
      return "space";
    default:
      break;
  }

  const lower = componentType.toLowerCase();

  if (lower.includes("header")) return "header";
  if (lower.includes("footer")) return "footer";
  if (lower.includes("image")) return "image";
  if (lower.includes("video")) return "video";
  if (lower.includes("button")) return "button";
  if (lower.includes("heading")) return "heading";
  if (lower.includes("paragraph") || lower.includes("text")) return "paragraph";

  return "unknown";
};

const getPreviewInitials = (value: string) => {
  const parts = value
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "BL";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const PREVIEW_DESCRIPTIONS: Partial<Record<PreviewKind, string>> = {
  heading: "يضيف عنواناً أو عنوان قسم واضحاً.",
  paragraph: "يضيف نصاً مسانداً للزوار.",
  richText: "يضيف محتوى منسقاً مع روابط وتنسيق.",
  button: "يضيف زراً أو رابط دعوة لاتخاذ إجراء.",
  image: "يضيف صورة واحدة مع تحكم بسيط بالحجم.",
  imageGallery: "يضيف معرضاً للصور أو تفاصيل المنتج.",
  video: "يضمّن فيديو من رابط عام.",
  accordion: "يضيف أسئلة شائعة أو إجابات قابلة للطي.",
  section: "يضيف شريطاً في الصفحة يمكن أن يحتوي عناصر أخرى.",
  layoutGrid: "يرتّب العناصر في أعمدة.",
  layoutFlex: "يرتّب العناصر في صف أو عمود مرن.",
  sidebar: "يضيف منطقة جانبية للقوائم أو الفلاتر أو العروض.",
  nav: "يضيف قائمة روابط.",
  productsGrid: "يعرض منتجات من مجموعة.",
  productCard: "يعرض منتجاً واحداً مع السعر وزر الإجراء.",
  cart: "يعرض عناصر السلة وملخص الدفع.",
  checkout: "يعرض حقول الدفع ومعلومات الطلب.",
  searchMenu: "يضيف درج بحث عن المنتجات.",
  categoryMenu: "يضيف متصفح الفئات.",
  productInfo: "يعرض عنوان المنتج والسعر والمخزون.",
  orderHistory: "يعرض طلبات العميل.",
  wishlist: "يعرض المنتجات المحفوظة.",
  testimonials: "يعرض آراء العملاء.",
  contactForm: "يجمع أسئلة العملاء.",
  header: "يضيف التنقل العلوي وعناصر العلامة التجارية.",
  footer: "يضيف التنقل السفلي وروابط المتجر.",
  drawerShell: "يضيف منطقة قائمة منزلقة.",
  hero: "يضيف قسم افتتاحي كبير للترويج.",
  stats: "يعرض أرقاماً رئيسية أو إشارات ثقة.",
  logos: "يعرض شعارات الشركاء أو الصحافة.",
  template: "يضيف قالب محتوى قابل لإعادة الاستخدام.",
  space: "يضيف مساحة فارغة محكومة.",
};

const getPreviewDescription = (
  kind: PreviewKind,
  metadata?: Record<string, unknown>
) => {
  const description =
    metadata?.previewDescription ?? metadata?.description ?? metadata?.helpText;

  return typeof description === "string" && description.trim()
    ? description.trim()
    : PREVIEW_DESCRIPTIONS[kind] ?? "يضيف عنصراً جاهزاً للتعديل.";
};

const createPreviewBody = (
  kind: PreviewKind,
  palette: PreviewPalette,
  componentType: string
) => {
  switch (kind) {
    case "heading":
      return [
        line(28, 32, 194, palette.accent, 12),
        line(28, 54, 142, "#cbd5e1", 9),
        line(28, 82, 238),
        line(28, 96, 246),
      ].join("");
    case "paragraph":
      return [
        line(28, 34, 244),
        line(28, 48, 252),
        line(28, 62, 238),
        line(28, 76, 246),
        line(28, 90, 216),
      ].join("");
    case "richText":
      return [
        line(28, 30, 86, palette.accent, 9),
        line(28, 50, 250),
        line(28, 64, 232),
        line(42, 80, 226),
        line(42, 94, 210),
        `<circle cx="31" cy="84" r="4" fill="#94a3b8"/>`,
        `<circle cx="31" cy="98" r="4" fill="#94a3b8"/>`,
      ].join("");
    case "button":
      return [
        line(28, 34, 142),
        roundedRect(96, 66, 128, 30, palette.accent, undefined, 16),
        `<text x="160" y="85" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#ffffff">Button</text>`,
      ].join("");
    case "image":
      return [
        roundedRect(30, 28, 258, 88, "#f8fafc", "#dbe6f7", 9),
        `<circle cx="250" cy="48" r="10" fill="#dbeafe"/>`,
        `<path d="M42 98 L90 62 L126 82 L168 56 L232 98 Z" fill="#c7d2fe"/>`,
      ].join("");
    case "imageGallery":
      return [
        roundedRect(28, 28, 84, 40, "#f8fafc", "#dbe6f7", 7),
        roundedRect(118, 28, 84, 40, "#f8fafc", "#dbe6f7", 7),
        roundedRect(208, 28, 84, 40, "#f8fafc", "#dbe6f7", 7),
        roundedRect(28, 74, 132, 46, "#ffffff", "#dbe6f7", 8),
        roundedRect(166, 74, 126, 46, "#ffffff", "#dbe6f7", 8),
        line(40, 90, 88),
        line(178, 90, 84),
        `<circle cx="100" cy="46" r="5" fill="#dbeafe"/>`,
        `<circle cx="190" cy="46" r="5" fill="#dbeafe"/>`,
        `<circle cx="280" cy="46" r="5" fill="#dbeafe"/>`,
      ].join("");
    case "video":
      return [
        roundedRect(34, 30, 252, 90, "#0f172a", "#1e293b", 10),
        `<circle cx="160" cy="75" r="20" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.3)"/>`,
        `<path d="M154 63 L174 75 L154 87 Z" fill="#ffffff"/>`,
      ].join("");
    case "divider":
      return [
        line(28, 78, 100),
        line(192, 78, 100),
        `<circle cx="160" cy="82" r="8" fill="${palette.accent}"/>`,
      ].join("");
    case "icon":
      return [
        `<circle cx="160" cy="74" r="31" fill="${palette.bg}" stroke="${palette.accent}" stroke-width="3"/>`,
        `<path d="M160 53 L166 67 L181 67 L169 76 L174 91 L160 82 L146 91 L151 76 L139 67 L154 67 Z" fill="${palette.accent}"/>`,
      ].join("");
    case "html":
      return [
        roundedRect(26, 28, 268, 92, "#0f172a", "#1e293b", 10),
        `<text x="40" y="72" font-family="Consolas, monospace" font-size="26" font-weight="700" fill="#93c5fd">&lt;/&gt;</text>`,
        line(138, 50, 124, "#334155"),
        line(138, 66, 102, "#334155"),
        line(138, 82, 118, "#334155"),
      ].join("");
    case "accordion":
      return [
        roundedRect(26, 30, 268, 26, "#ffffff", "#dbe6f7", 8),
        roundedRect(26, 62, 268, 26, "#ffffff", "#dbe6f7", 8),
        roundedRect(26, 94, 268, 26, "#ffffff", "#dbe6f7", 8),
        line(40, 40, 120),
        line(40, 72, 162),
        line(40, 104, 146),
        `<path d="M266 42 l8 8 l8 -8" stroke="#64748b" stroke-width="2" fill="none"/>`,
        `<path d="M266 74 l8 8 l8 -8" stroke="#64748b" stroke-width="2" fill="none"/>`,
        `<path d="M266 106 l8 8 l8 -8" stroke="#64748b" stroke-width="2" fill="none"/>`,
      ].join("");
    case "section":
      return [
        `<rect x="24" y="26" width="272" height="96" rx="10" fill="#ffffff" stroke="${palette.accent}" stroke-dasharray="5 4"/>`,
        line(38, 40, 170, palette.accent, 10),
        line(38, 58, 220),
        line(38, 72, 210),
        roundedRect(38, 88, 94, 22, palette.accent, undefined, 11),
      ].join("");
    case "layoutGrid":
      return [
        roundedRect(30, 32, 120, 38, "#f8fafc", "#dbe6f7", 8),
        roundedRect(170, 32, 120, 38, "#f8fafc", "#dbe6f7", 8),
        roundedRect(30, 82, 120, 38, "#f8fafc", "#dbe6f7", 8),
        roundedRect(170, 82, 120, 38, "#f8fafc", "#dbe6f7", 8),
      ].join("");
    case "layoutFlex":
      return [
        roundedRect(30, 58, 76, 36, palette.bg, "#dbe6f7", 8),
        roundedRect(122, 58, 76, 36, palette.bg, "#dbe6f7", 8),
        roundedRect(214, 58, 76, 36, palette.bg, "#dbe6f7", 8),
      ].join("");
    case "sidebar":
      return [
        roundedRect(26, 28, 80, 96, "#f8fafc", "#dbe6f7", 8),
        line(38, 42, 56),
        line(38, 58, 48),
        line(38, 74, 52),
        roundedRect(116, 28, 178, 96, "#ffffff", "#dbe6f7", 8),
        line(130, 44, 124),
        line(130, 62, 144),
        line(130, 80, 112),
      ].join("");
    case "nav":
      return [
        roundedRect(24, 28, 272, 24, "#ffffff", "#dbe6f7", 8),
        roundedRect(34, 34, 44, 12, palette.bg, "#cbd5e1", 6),
        roundedRect(86, 34, 52, 12, palette.bg, "#cbd5e1", 6),
        roundedRect(146, 34, 46, 12, palette.bg, "#cbd5e1", 6),
        roundedRect(214, 34, 70, 12, palette.accent, undefined, 6),
        line(32, 72, 220),
        line(32, 88, 242),
      ].join("");
    case "productsGrid":
      return [
        roundedRect(28, 30, 122, 42, "#ffffff", "#dbe6f7", 7),
        roundedRect(170, 30, 122, 42, "#ffffff", "#dbe6f7", 7),
        roundedRect(28, 80, 122, 42, "#ffffff", "#dbe6f7", 7),
        roundedRect(170, 80, 122, 42, "#ffffff", "#dbe6f7", 7),
        line(38, 40, 74),
        line(180, 40, 74),
        line(38, 90, 74),
        line(180, 90, 74),
        roundedRect(96, 56, 44, 10, palette.accent, undefined, 5),
        roundedRect(238, 56, 44, 10, palette.accent, undefined, 5),
        roundedRect(96, 106, 44, 10, palette.accent, undefined, 5),
        roundedRect(238, 106, 44, 10, palette.accent, undefined, 5),
      ].join("");
    case "productCard":
      return [
        roundedRect(86, 26, 148, 102, "#ffffff", "#dbe6f7", 10),
        roundedRect(98, 36, 124, 46, "#f1f5f9", "#dbe6f7", 7),
        line(100, 88, 92),
        roundedRect(100, 104, 70, 12, palette.accent, undefined, 6),
      ].join("");
    case "cart":
      return [
        roundedRect(24, 28, 272, 26, "#ffffff", "#dbe6f7", 8),
        roundedRect(24, 60, 272, 26, "#ffffff", "#dbe6f7", 8),
        roundedRect(24, 92, 272, 26, "#ffffff", "#dbe6f7", 8),
        line(38, 38, 122),
        line(38, 70, 122),
        line(38, 102, 122),
        roundedRect(236, 34, 46, 14, "#e2e8f0", undefined, 7),
        roundedRect(236, 66, 46, 14, "#e2e8f0", undefined, 7),
        roundedRect(236, 98, 46, 14, palette.accent, undefined, 7),
      ].join("");
    case "checkout":
      return [
        roundedRect(30, 26, 260, 100, "#ffffff", "#dbe6f7", 10),
        roundedRect(44, 42, 108, 12, "#f1f5f9", "#dbe6f7", 6),
        roundedRect(168, 42, 108, 12, "#f1f5f9", "#dbe6f7", 6),
        roundedRect(44, 62, 232, 12, "#f1f5f9", "#dbe6f7", 6),
        roundedRect(44, 82, 232, 12, "#f1f5f9", "#dbe6f7", 6),
        roundedRect(182, 102, 94, 14, palette.accent, undefined, 7),
      ].join("");
    case "searchMenu":
      return [
        roundedRect(24, 30, 272, 24, "#ffffff", "#dbe6f7", 12),
        `<circle cx="42" cy="42" r="6" stroke="#64748b" stroke-width="2" fill="none"/>`,
        `<path d="M47 47 L53 53" stroke="#64748b" stroke-width="2"/>`,
        line(56, 38, 96),
        roundedRect(24, 62, 272, 56, "#ffffff", "#dbe6f7", 8),
        line(38, 76, 224),
        line(38, 92, 210),
        line(38, 108, 192),
      ].join("");
    case "categoryMenu":
      return [
        roundedRect(24, 30, 84, 18, palette.bg, "#dbe6f7", 9),
        roundedRect(116, 30, 68, 18, palette.bg, "#dbe6f7", 9),
        roundedRect(192, 30, 98, 18, palette.bg, "#dbe6f7", 9),
        roundedRect(24, 56, 68, 18, palette.bg, "#dbe6f7", 9),
        roundedRect(100, 56, 82, 18, palette.bg, "#dbe6f7", 9),
        roundedRect(190, 56, 100, 18, palette.bg, "#dbe6f7", 9),
        roundedRect(24, 84, 272, 34, "#ffffff", "#dbe6f7", 8),
      ].join("");
    case "productInfo":
      return [
        line(28, 32, 170, palette.accent, 11),
        roundedRect(214, 30, 78, 16, "#fef3c7", "#fcd34d", 8),
        line(28, 54, 98, "#cbd5e1", 10),
        line(28, 74, 246),
        line(28, 88, 238),
        roundedRect(28, 104, 114, 16, palette.accent, undefined, 8),
      ].join("");
    case "orderHistory":
      return [
        roundedRect(24, 28, 272, 16, "#f1f5f9", "#dbe6f7", 6),
        roundedRect(24, 48, 272, 20, "#ffffff", "#dbe6f7", 6),
        roundedRect(24, 72, 272, 20, "#ffffff", "#dbe6f7", 6),
        roundedRect(24, 96, 272, 20, "#ffffff", "#dbe6f7", 6),
        line(36, 33, 46),
        line(108, 33, 64),
        line(198, 33, 54),
        line(36, 54, 52),
        line(108, 54, 68),
        line(198, 54, 48, palette.accent),
      ].join("");
    case "wishlist":
      return [
        roundedRect(30, 30, 122, 86, "#ffffff", "#dbe6f7", 8),
        roundedRect(168, 30, 122, 86, "#ffffff", "#dbe6f7", 8),
        `<circle cx="136" cy="44" r="7" fill="#fecaca"/>`,
        `<circle cx="274" cy="44" r="7" fill="#fecaca"/>`,
        line(42, 88, 74),
        line(180, 88, 74),
      ].join("");
    case "testimonials":
      return [
        roundedRect(28, 30, 126, 88, "#ffffff", "#dbe6f7", 8),
        roundedRect(166, 30, 126, 88, "#ffffff", "#dbe6f7", 8),
        line(40, 44, 92),
        line(40, 58, 84),
        `<circle cx="50" cy="96" r="10" fill="#dbeafe"/>`,
        line(66, 92, 54),
        line(178, 44, 92),
        line(178, 58, 84),
        `<circle cx="188" cy="96" r="10" fill="#dbeafe"/>`,
        line(204, 92, 54),
      ].join("");
    case "contactForm":
      return [
        roundedRect(30, 28, 260, 92, "#ffffff", "#dbe6f7", 10),
        roundedRect(44, 42, 108, 12, "#f8fafc", "#dbe6f7", 6),
        roundedRect(168, 42, 108, 12, "#f8fafc", "#dbe6f7", 6),
        roundedRect(44, 62, 232, 12, "#f8fafc", "#dbe6f7", 6),
        roundedRect(44, 82, 232, 24, "#f8fafc", "#dbe6f7", 6),
        roundedRect(204, 108, 72, 10, palette.accent, undefined, 5),
      ].join("");
    case "header":
      return [
        roundedRect(24, 28, 272, 24, "#ffffff", "#dbe6f7", 8),
        roundedRect(34, 34, 66, 12, palette.accent, undefined, 6),
        roundedRect(178, 34, 34, 12, "#e2e8f0", undefined, 6),
        roundedRect(218, 34, 34, 12, "#e2e8f0", undefined, 6),
        roundedRect(258, 34, 28, 12, "#e2e8f0", undefined, 6),
        line(24, 70, 186),
      ].join("");
    case "footer":
      return [
        roundedRect(24, 34, 272, 68, "#f8fafc", "#dbe6f7", 8),
        line(40, 48, 58),
        line(116, 48, 58),
        line(192, 48, 58),
        line(40, 64, 46),
        line(116, 64, 42),
        line(192, 64, 48),
        line(40, 80, 224, "#cbd5e1", 6),
      ].join("");
    case "drawerShell":
      return [
        roundedRect(24, 28, 272, 96, "#ffffff", "#dbe6f7", 8),
        roundedRect(202, 28, 94, 96, "#f8fafc", "#dbe6f7", 8),
        line(214, 42, 66),
        line(214, 58, 58),
        line(214, 74, 62),
      ].join("");
    case "hero":
      return [
        roundedRect(24, 26, 272, 98, "#ffffff", "#dbe6f7", 10),
        line(38, 42, 126, palette.accent, 11),
        line(38, 60, 136),
        line(38, 76, 124),
        roundedRect(38, 94, 76, 14, palette.accent, undefined, 7),
        roundedRect(178, 40, 104, 70, "#f1f5f9", "#dbe6f7", 8),
      ].join("");
    case "stats":
      return [
        roundedRect(28, 36, 82, 72, "#f8fafc", "#dbe6f7", 8),
        roundedRect(119, 36, 82, 72, "#f8fafc", "#dbe6f7", 8),
        roundedRect(210, 36, 82, 72, "#f8fafc", "#dbe6f7", 8),
        `<text x="69" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${palette.accent}">120</text>`,
        `<text x="160" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${palette.accent}">4.8</text>`,
        `<text x="251" y="70" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="${palette.accent}">24h</text>`,
      ].join("");
    case "logos":
      return [
        `<circle cx="54" cy="74" r="18" fill="#e2e8f0"/>`,
        `<circle cx="98" cy="74" r="18" fill="#e2e8f0"/>`,
        `<circle cx="142" cy="74" r="18" fill="#e2e8f0"/>`,
        `<circle cx="186" cy="74" r="18" fill="#e2e8f0"/>`,
        `<circle cx="230" cy="74" r="18" fill="#e2e8f0"/>`,
        `<circle cx="274" cy="74" r="18" fill="#e2e8f0"/>`,
      ].join("");
    case "template":
      return [
        roundedRect(26, 28, 268, 20, "#ffffff", "#dbe6f7", 8),
        roundedRect(26, 54, 268, 30, "#f8fafc", "#dbe6f7", 8),
        roundedRect(26, 90, 268, 30, "#ffffff", "#dbe6f7", 8),
      ].join("");
    case "space":
      return [
        line(36, 52, 248, "#cbd5e1", 6),
        line(36, 96, 248, "#cbd5e1", 6),
        `<path d="M160 58 L160 90" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4 4"/>`,
        `<path d="M153 64 L160 56 L167 64" stroke="#94a3b8" stroke-width="2" fill="none"/>`,
        `<path d="M153 84 L160 92 L167 84" stroke="#94a3b8" stroke-width="2" fill="none"/>`,
      ].join("");
    default: {
      const initials = escapeSvgText(getPreviewInitials(componentType));
      return [
        roundedRect(108, 38, 104, 66, "#ffffff", "#dbe6f7", 10),
        `<text x="160" y="80" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${palette.accent}">${initials}</text>`,
      ].join("");
    }
  }
};

const createDrawerPreviewImage = (
  componentType: string,
  displayLabel: string
) => {
  const palette = getPreviewPalette(componentType);
  const safeLabel = escapeSvgText(displayLabel.slice(0, 30));
  const kind = getPreviewKind(componentType);
  const body = createPreviewBody(kind, palette, componentType);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="176" viewBox="0 0 320 176" role="img" aria-label="${safeLabel}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette.bg}"/><stop offset="100%" stop-color="#ffffff"/></linearGradient></defs><rect x="1" y="1" width="318" height="174" rx="14" fill="url(#g)" stroke="#dbe6f7"/><rect x="14" y="14" width="292" height="126" rx="10" fill="#ffffff" stroke="#dbe6f7"/>${body}<rect x="14" y="146" width="292" height="22" rx="8" fill="#f8fafc" stroke="#dbe6f7"/><circle cx="26" cy="157" r="5" fill="${palette.accent}"/><text x="38" y="161" font-family="Arial, sans-serif" font-size="12" font-weight="600" fill="${palette.text}">${safeLabel}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const PREVIEW_PUCK_CONTEXT: PuckContext = {
  isEditing: true,
  dragRef: null,
  metadata: {},
  renderDropZone: () => null,
};

const getSlotItemTypes = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (item == null || typeof item !== "object") return null;
      if (!("type" in item)) return null;
      const componentType = (item as { type?: unknown }).type;
      return typeof componentType === "string" ? componentType : null;
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 5);
};

const createSlotStub = (fieldName: string, slotItems: string[]) => {
  const SlotPreview = ({ className, style, as }: any = {}) => {
    const Tag = (as ?? "div") as any;
    const fullClassName = `${className ?? ""} ${getClassNameItem("slotStub")}`.trim();

    return (
      <Tag className={fullClassName} style={style}>
        {slotItems.length > 0 ? (
          slotItems.map((item, index) => (
            <span key={`${item}-${index}`} className={getClassNameItem("slotChip")}>
              {item}
            </span>
          ))
        ) : (
          <span className={getClassNameItem("slotEmpty")}>{fieldName}</span>
        )}
      </Tag>
    );
  };

  SlotPreview.displayName = `DrawerSlotStub(${fieldName})`;

  return SlotPreview;
};

const TEMPLATE_ONLY_KINDS = new Set<PreviewKind>([
  "productsGrid",
  "productCard",
  "cart",
  "checkout",
  "searchMenu",
  "categoryMenu",
  "productInfo",
  "orderHistory",
  "wishlist",
  "testimonials",
  "contactForm",
  "header",
  "footer",
  "drawerShell",
  "hero",
  "stats",
  "logos",
  "template",
  "nav",
  "unknown",
]);

const shouldUseLivePreview = (kind: PreviewKind) =>
  !TEMPLATE_ONLY_KINDS.has(kind);

const truncatePreviewText = (value: string, max = 120) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}...`;
};

const createLivePreviewProps = (
  componentType: string,
  defaultProps?: Record<string, unknown>,
  fields?: Record<string, Field | unknown>
) => {
  const resolvedProps: Record<string, unknown> = {
    ...(defaultProps ?? {}),
  };

  Object.entries(fields ?? {}).forEach(([fieldName, fieldValue]) => {
    const field = fieldValue as Field | undefined;

    if (field?.type === "slot") {
      const slotItems = getSlotItemTypes(resolvedProps[fieldName]);
      resolvedProps[fieldName] = createSlotStub(fieldName, slotItems);
      return;
    }

    if (field?.type === "array" && Array.isArray(resolvedProps[fieldName])) {
      resolvedProps[fieldName] = (resolvedProps[fieldName] as unknown[]).slice(0, 2);
      return;
    }

    if (
      (field?.type === "text" ||
        field?.type === "textarea" ||
        field?.type === "richtext") &&
      typeof resolvedProps[fieldName] === "string"
    ) {
      resolvedProps[fieldName] = truncatePreviewText(
        resolvedProps[fieldName] as string
      );
    }
  });

  const layoutValue = resolvedProps.layout;
  if (layoutValue != null && typeof layoutValue === "object") {
    resolvedProps.layout = {
      ...(layoutValue as Record<string, unknown>),
      marginTop: "0px",
      marginRight: "0px",
      marginBottom: "0px",
      marginLeft: "0px",
      paddingTop: "0px",
      paddingRight: "0px",
      paddingBottom: "0px",
      paddingLeft: "0px",
      padding: "0px",
      positionMode: "static",
      floatPlacementMode: "preset",
      floatPreset: "top-left",
      hideOnMobile: false,
      hideOnTablet: false,
      hideOnDesktop: false,
    };
  }

  if (resolvedProps.id == null) {
    resolvedProps.id = `drawer-preview-${componentType}`;
  }

  return {
    ...resolvedProps,
    puck: PREVIEW_PUCK_CONTEXT,
    editMode: true,
  };
};

class DrawerPreviewBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export const DrawerItemInner = ({
  children,
  name,
  label,
  dragRef,
  isDragDisabled,
}: {
  children?: (props: { children: ReactNode; name: string }) => ReactElement;
  name: string;
  label?: string;
  dragRef?: Ref<any>;
  isDragDisabled?: boolean;
}) => {
  const CustomInner = useMemo(
    () =>
      children ||
      (({ children }: { children: ReactNode; name: string }) => (
        <div className={getClassNameItem("default")}>{children}</div>
      )),
    [children]
  );

  const previewSource = useMemo(
    () => createDrawerPreviewImage(name, label ?? name),
    [label, name]
  );

  const componentConfig = useAppStore(
    (s) => (s.config.components as Record<string, any>)[name]
  );

  const PreviewRender = componentConfig?.render as
    | ((props: Record<string, unknown>) => ReactNode)
    | undefined;

  const previewKind = useMemo(() => getPreviewKind(name), [name]);
  const previewDescription = useMemo(
    () =>
      getPreviewDescription(
        previewKind,
        componentConfig?.metadata as Record<string, unknown> | undefined
      ),
    [componentConfig?.metadata, previewKind]
  );

  const livePreviewProps = useMemo(() => {
    if (!componentConfig) return null;

    return createLivePreviewProps(
      name,
      componentConfig.defaultProps as Record<string, unknown> | undefined,
      componentConfig.fields as Record<string, Field | unknown> | undefined
    );
  }, [componentConfig, name]);

  const fallbackPreview = (
    <img
      className={getClassNameItem("previewImage")}
      src={previewSource}
      alt=""
      loading="lazy"
      decoding="async"
    />
  );

  const showHoverPreview = Boolean(dragRef);
  const showLivePreview =
    Boolean(PreviewRender && livePreviewProps) && shouldUseLivePreview(previewKind);

  return (
    <div
      className={getClassNameItem({ disabled: isDragDisabled })}
      ref={dragRef}
      onMouseDown={(e) => e.preventDefault()}
      data-testid={dragRef ? `drawer-item:${name}` : ""}
      data-puck-drawer-item
    >
      <CustomInner name={name}>
        <div className={getClassNameItem("draggableWrapper")}>
          <div className={getClassNameItem("draggable")}>
            <BlockAvatar name={name} />
            <div className={getClassNameItem("name")}>{label ?? name}</div>
            <div className={getClassNameItem("icon")}>
              <DragIcon />
            </div>
          </div>
        </div>
      </CustomInner>

      {showHoverPreview ? (
        <div className={getClassNameItem("preview")} aria-hidden="true">
          <DrawerPreviewBoundary key={name} fallback={fallbackPreview}>
            {showLivePreview ? (
              <div className={getClassNameItem("previewSurface")}>
                <div className={getClassNameItem("previewStage")}>
                  {createElement(
                    PreviewRender as (props: Record<string, unknown>) => ReactNode,
                    livePreviewProps as Record<string, unknown>
                  )}
                </div>
              </div>
            ) : (
              fallbackPreview
            )}
          </DrawerPreviewBoundary>

          <div className={getClassNameItem("previewCaption")}>
            <span>
              <strong>{label ?? name}</strong>
              <small>{previewDescription}</small>
            </span>
            <span className={getClassNameItem("previewSubCaption")}>
              {showLivePreview ? "معاينة حية" : "مثال"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/**
 * Wrap `useDraggable`, remounting it when the `id` changes.
 *
 * Could be removed by remounting `useDraggable` upstream in dndkit on `id` changes.
 */
const DrawerItemDraggable = ({
  children,
  name,
  label,
  id,
  isDragDisabled,
}: {
  children?: (props: { children: ReactNode; name: string }) => ReactElement;
  name: string;
  label?: string;
  id: string;
  isDragDisabled?: boolean;
}) => {
  const { ref } = useDraggable({
    id,
    data: { componentType: name },
    disabled: isDragDisabled,
    type: "drawer",
  });

  return (
    <div className={getClassName("draggable")}>
      <div className={getClassName("draggableBg")}>
        <DrawerItemInner name={name} label={label}>
          {children}
        </DrawerItemInner>
      </div>
      <div className={getClassName("draggableFg")}>
        <DrawerItemInner
          name={name}
          label={label}
          dragRef={ref}
          isDragDisabled={isDragDisabled}
        >
          {children}
        </DrawerItemInner>
      </div>
    </div>
  );
};

const DrawerItem = ({
  name,
  children,
  id,
  label,
  index,
  isDragDisabled,
}: {
  name: string;
  children?: (props: { children: ReactNode; name: string }) => ReactElement;
  id?: string;
  label?: string;
  index?: number; // TODO deprecate
  isDragDisabled?: boolean;
}) => {
  const resolvedId = id || name;
  const [dynamicId, setDynamicId] = useState(generateId(resolvedId));

  if (typeof index !== "undefined") {
    console.error(
      "Warning: The `index` prop on Drawer.Item is deprecated and no longer required."
    );
  }

  useDragListener(
    "dragend",
    () => {
      setDynamicId(generateId(resolvedId));
    },
    [resolvedId]
  );

  return (
    <div key={dynamicId}>
      <DrawerItemDraggable
        name={name}
        label={label}
        id={dynamicId}
        isDragDisabled={isDragDisabled}
      >
        {children}
      </DrawerItemDraggable>
    </div>
  );
};

export const Drawer = ({
  children,
  droppableId,
  direction,
}: {
  children: ReactNode;
  droppableId?: string; // TODO deprecate
  direction?: "vertical" | "horizontal"; // TODO deprecate
}) => {
  if (droppableId) {
    console.error(
      "Warning: The `droppableId` prop on Drawer is deprecated and no longer required."
    );
  }

  if (direction) {
    console.error(
      "Warning: The `direction` prop on Drawer is deprecated and no longer required to achieve multi-directional dragging."
    );
  }

  const id = useSafeId();

  const { ref } = useDroppable({
    id,
    type: "void",
    collisionPriority: 0, // Never collide with this, but we use it so NestedDroppablePlugin respects the Drawer
  });

  return (
    <div
      className={getClassName()}
      ref={ref}
      data-puck-dnd={id}
      data-puck-drawer
      data-puck-dnd-void
    >
      {children}
    </div>
  );
};

Drawer.Item = DrawerItem;
