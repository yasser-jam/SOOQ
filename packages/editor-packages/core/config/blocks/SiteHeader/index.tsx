import React from "react";
import { ComponentConfig } from "@/core/types";
import type { Slot } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import { EMPTY_LINK, linkField } from "../../fields/LinkField";
import {
  Header,
  DEFAULT_HEADER_LINKS,
  type HeaderDrawerIcon,
  type HeaderLink,
} from "../../components/Header";
import { ZONE_BLOCK_PERMISSIONS, ZONE_BLOCK_TYPES } from "../../shell-zones";
import { applyMobileEditorFieldGroups } from "../../lib/mobile-field-groups";

export type SiteHeaderProps = {
  title: string;
  variant: ShellVariant;
  language: "ar" | "en";
  visible: boolean;
  is_mobile_only: boolean;
  brandHref: string;
  links: HeaderLink[];
  backgroundColor: string;
  textColor: string;
  /** `centered` puts nav in the middle; `split` keeps brand and nav on opposite sides */
  layoutMode?: "centered" | "split";
  /** For split layout — which edge the nav sits on (brand goes to the other side) */
  menuAlign?: "start" | "end";
  /** Nav hover/active styling */
  navStyle?: "underline" | "pill";
  showDrawerButton: boolean;
  drawerButtonIcon: HeaderDrawerIcon;
  drawerName: string;
  /** Optional action buttons (e.g. CartIconButton) rendered at the end of the header */
  rightSlot: Slot;
};

export const SiteHeader: ComponentConfig<SiteHeaderProps> = {
  label: "رأس الموقع",
  permissions: {
    ...ZONE_BLOCK_PERMISSIONS,
  },
  fields: {
    title: {
      type: "text",
      label: "عنوان العلامة التجارية",
    },
    variant: {
      type: "select",
      label: "نوع التخطيط",
      options: [
        { label: "Commerce", value: "commerce" },
        { label: "Default", value: "default" },
      ],
    },
    language: {
      type: "radio",
      label: "اللغة",
      options: [
        { label: "Arabic", value: "ar" },
        { label: "English", value: "en" },
      ],
    },
    visible: {
      type: "radio",
      label: "مرئي",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    is_mobile_only: {
      type: "radio",
      label: "الجوال فقط",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    brandHref: {
      type: "text",
      label: "رابط العلامة التجارية",
      placeholder: "/",
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
    backgroundColor: colorField({
      label: "لون الخلفية",
      description: "Empty = use theme default.",
    }),
    textColor: colorField({
      label: "لون النص",
      description: "Empty = use theme default.",
    }),
    layoutMode: {
      type: "radio",
      label: "تخطيط الرأس",
      options: [
        { label: "Split", value: "split" },
        { label: "Centered", value: "centered" },
      ],
    },
    menuAlign: {
      type: "radio",
      label: "محاذاة القائمة",
      options: [
        { label: "Start", value: "start" },
        { label: "End", value: "end" },
      ],
    },
    navStyle: {
      type: "radio",
      label: "نمط عناصر القائمة",
      options: [
        { label: "Pill", value: "pill" },
        { label: "Underline", value: "underline" },
      ],
    },
    showDrawerButton: {
      type: "radio",
      label: "إظهار زر القائمة",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    drawerButtonIcon: {
      type: "select",
      label: "أيقونة القائمة",
      options: [
        { label: "Menu", value: "menu" },
        { label: "Filter", value: "filter" },
        { label: "Cart", value: "cart" },
        { label: "User", value: "user" },
        { label: "Hide", value: "none" },
      ],
    },
    drawerName: {
      type: "text",
      label: "اسم القائمة",
      placeholder: "site-drawer",
    },
    rightSlot: {
      type: "slot",
      disallow: ["Section", ...ZONE_BLOCK_TYPES],
    },
  },
  defaultProps: {
    title: "",
    variant: "commerce",
    language: "ar",
    visible: true,
    is_mobile_only: false,
    brandHref: "/",
    links: DEFAULT_HEADER_LINKS,
    backgroundColor: "",
    textColor: "",
    layoutMode: "split",
    menuAlign: "end",
    navStyle: "pill",
    showDrawerButton: false,
    drawerButtonIcon: "menu",
    drawerName: "site-drawer",
    rightSlot: [],
  },
  resolveFields: (_data, params) =>
    applyMobileEditorFieldGroups(params.fields, params.metadata),
  render: ({
    title,
    variant,
    language,
    visible,
    is_mobile_only,
    brandHref,
    links,
    backgroundColor,
    textColor,
    layoutMode,
    menuAlign,
    navStyle,
    showDrawerButton,
    drawerButtonIcon,
    drawerName,
    rightSlot: RightSlot,
    id,
    puck,
  }) => {
    return (
      <Header
        editMode={!!puck.isEditing}
        componentId={typeof id === "string" ? id : undefined}
        variant={variant}
        siteTitle={title}
        links={links}
        language={language}
        visible={visible}
        isMobileOnly={is_mobile_only}
        brandHref={brandHref}
        backgroundColor={backgroundColor || undefined}
        textColor={textColor || undefined}
        layoutMode={layoutMode}
        menuAlign={menuAlign}
        navStyle={navStyle}
        showDrawerButton={showDrawerButton}
        drawerButtonIcon={drawerButtonIcon}
        drawerName={drawerName || "site-drawer"}
        rightSlot={<RightSlot />}
      />
    );
  },
};
