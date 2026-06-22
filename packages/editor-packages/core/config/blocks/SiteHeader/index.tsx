import React from "react";
import { ComponentConfig } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import { EMPTY_LINK, linkField } from "../../fields/LinkField";
import {
  Header,
  DEFAULT_HEADER_LINKS,
  type HeaderDrawerIcon,
  type HeaderLink,
} from "../../components/Header";
import type { ShellVariant } from "../../theme";

export type SiteHeaderProps = {
  title: string;
  variant: ShellVariant;
  language: "ar" | "en";
  visible: boolean;
  brandHref: string;
  links: HeaderLink[];
  backgroundColor: string;
  textColor: string;
  showDrawerButton: boolean;
  drawerButtonIcon: HeaderDrawerIcon;
  drawerName: string;
};

export const SiteHeader: ComponentConfig<SiteHeaderProps> = {
  label: "رأس الموقع",
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
  },
  defaultProps: {
    title: "",
    variant: "commerce",
    language: "ar",
    visible: true,
    brandHref: "/",
    links: DEFAULT_HEADER_LINKS,
    backgroundColor: "",
    textColor: "",
    showDrawerButton: false,
    drawerButtonIcon: "menu",
    drawerName: "site-drawer",
  },
  render: ({
    title,
    variant,
    language,
    visible,
    brandHref,
    links,
    backgroundColor,
    textColor,
    showDrawerButton,
    drawerButtonIcon,
    drawerName,
    puck,
  }) => {
    return (
      <Header
        editMode={!!puck.isEditing}
        variant={variant}
        siteTitle={title}
        links={links}
        language={language}
        visible={visible}
        brandHref={brandHref}
        backgroundColor={backgroundColor || undefined}
        textColor={textColor || undefined}
        showDrawerButton={showDrawerButton}
        drawerButtonIcon={drawerButtonIcon}
        drawerName={drawerName || "site-drawer"}
      />
    );
  },
};
