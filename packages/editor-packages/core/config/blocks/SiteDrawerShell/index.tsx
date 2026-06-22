import React from "react";
import { ComponentConfig } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import { EMPTY_LINK, linkField } from "../../fields/LinkField";
import {
  SiteDrawer,
  DEFAULT_DRAWER_LINKS,
  type SiteDrawerAnimation,
  type SiteDrawerIcon,
  type SiteDrawerLink,
  type SiteDrawerSide,
  type SiteDrawerTrigger,
} from "../../components/SiteDrawer";

export type SiteDrawerShellProps = {
  name: string;
  enabled: boolean;
  side: SiteDrawerSide;
  widthPx: number;
  animation: SiteDrawerAnimation;
  animationDurationMs: number;
  trigger: SiteDrawerTrigger;
  triggerLabel: string;
  triggerLabelAr: string;
  triggerIcon: SiteDrawerIcon;
  title: string;
  titleAr: string;
  showTitle: boolean;
  links: SiteDrawerLink[];
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  triggerBackgroundColor: string;
  triggerTextColor: string;
  overlay: boolean;
  overlayOpacityPercent: number;
  closeOnOverlayClick: boolean;
  closeOnEsc: boolean;
  showCloseButton: boolean;
  startOpen: boolean;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  openOnEdgeHover: boolean;
  language: "ar" | "en";
};

export const SiteDrawerShell: ComponentConfig<SiteDrawerShellProps> = {
  label: "درج جانبي",
  permissions: {
    insert: false,
    duplicate: false,
    delete: false,
  },
  fields: {
    enabled: {
      type: "radio",
      label: "مفعل",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    name: {
      type: "text",
      label: "اسم القائمة",
      placeholder: "site-drawer",
    },
    language: {
      type: "radio",
      label: "اللغة",
      options: [
        { label: "Arabic", value: "ar" },
        { label: "English", value: "en" },
      ],
    },
    side: {
      type: "radio",
      label: "الجهة المثبتة",
      options: [
        { label: "Left", value: "left" },
        { label: "Right", value: "right" },
      ],
    },
    widthPx: {
      type: "number",
      label: "العرض (بكسل)",
      min: 200,
      max: 720,
    },
    trigger: {
      type: "select",
      label: "يفتح عبر",
      options: [
        { label: "Header/external trigger", value: "external" },
        { label: "Floating button", value: "floating" },
        { label: "Auto-open on page load", value: "auto" },
        { label: "None", value: "none" },
      ],
    },
    triggerLabel: {
      type: "text",
      label: "نص الزر (إنجليزي)",
    },
    triggerLabelAr: {
      type: "text",
      label: "نص الزر (عربي)",
    },
    triggerIcon: {
      type: "select",
      label: "أيقونة التشغيل",
      options: [
        { label: "Menu", value: "menu" },
        { label: "Filter", value: "filter" },
        { label: "Cart", value: "cart" },
        { label: "User", value: "user" },
        { label: "Panel", value: "panel" },
        { label: "None", value: "none" },
      ],
    },
    title: {
      type: "text",
      label: "العنوان (إنجليزي)",
    },
    titleAr: {
      type: "text",
      label: "العنوان (عربي)",
    },
    showTitle: {
      type: "radio",
      label: "إظهار العنوان",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    links: {
      type: "array",
      label: "روابط التنقل",
      arrayFields: {
        label: { type: "text", label: "التسمية (إنجليزي)" },
        labelAr: { type: "text", label: "التسمية (عربي)" },
        link: linkField({ label: "الوجهة" }),
      },
      defaultItemProps: {
        label: "New link",
        labelAr: "عنصر",
        link: EMPTY_LINK,
      },
      getItemSummary: (item: { label?: string; href?: string }) =>
        item?.label || item?.href || "Link",
    } as any,
    backgroundColor: colorField({ label: "خلفية القائمة" }),
    textColor: colorField({ label: "نص القائمة" }),
    accentColor: colorField({
      label: "لون التمييز",
      description: "Used for hover/link emphasis.",
    }),
    triggerBackgroundColor: colorField({ label: "خلفية الزر" }),
    triggerTextColor: colorField({ label: "نص الزر" }),
    animation: {
      type: "select",
      label: "الحركة",
      options: [
        { label: "Slide", value: "slide" },
        { label: "Fade", value: "fade" },
        { label: "Scale", value: "scale" },
        { label: "None", value: "none" },
      ],
    },
    animationDurationMs: {
      type: "number",
      label: "مدة الحركة (مللي ثانية)",
      min: 0,
      max: 2000,
    },
    overlay: {
      type: "radio",
      label: "تعتيم الخلفية عند الفتح",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    overlayOpacityPercent: {
      type: "number",
      label: "شفافية الطبقة (%)",
      min: 0,
      max: 100,
    },
    closeOnOverlayClick: {
      type: "radio",
      label: "إغلاق عند النقر على الطبقة",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    closeOnEsc: {
      type: "radio",
      label: "إغلاق عند الضغط على Escape",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showCloseButton: {
      type: "radio",
      label: "إظهار زر الإغلاق",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    startOpen: {
      type: "radio",
      label: "افتح افتراضياً",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showOnMobile: {
      type: "radio",
      label: "إظهار على الجوال",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    showOnDesktop: {
      type: "radio",
      label: "إظهار على سطح المكتب",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    openOnEdgeHover: {
      type: "radio",
      label: "الإظهار عند اقتراب الماوس من حافة الصفحة",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
  },
  defaultProps: {
    name: "site-drawer",
    enabled: true,
    side: "left",
    widthPx: 320,
    animation: "slide",
    animationDurationMs: 260,
    trigger: "external",
    triggerLabel: "Menu",
    triggerLabelAr: "القائمة",
    triggerIcon: "menu",
    title: "Menu",
    titleAr: "القائمة",
    showTitle: true,
    links: DEFAULT_DRAWER_LINKS,
    backgroundColor: "#ffffff",
    textColor: "#111827",
    accentColor: "#2563eb",
    triggerBackgroundColor: "#ffffff",
    triggerTextColor: "#111827",
    overlay: true,
    overlayOpacityPercent: 50,
    closeOnOverlayClick: true,
    closeOnEsc: true,
    showCloseButton: true,
    startOpen: false,
    showOnMobile: true,
    showOnDesktop: true,
    openOnEdgeHover: true,
    language: "ar",
  },
  render: ({ puck, ...props }) => {
    return <></>
    // return <SiteDrawer {...props} editMode={!!puck.isEditing} />;
  },
};
