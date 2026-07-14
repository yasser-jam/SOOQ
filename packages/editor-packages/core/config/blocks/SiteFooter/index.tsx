import React from "react";
import { ComponentConfig } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import { EMPTY_LINK, linkField } from "../../fields/LinkField";
import {
  Footer,
  DEFAULT_FOOTER_COLUMNS,
  DEFAULT_FOOTER_BOTTOM_LINKS,
  type FooterColumn,
  type FooterLinkData,
} from "../../components/Footer";
import type { ShellVariant } from "../../theme";
import { ZONE_BLOCK_PERMISSIONS } from "../../shell-zones";
import { applyMobileEditorFieldGroups } from "../../lib/mobile-field-groups";

export type SiteFooterProps = {
  title: string;
  variant: ShellVariant;
  language: "ar" | "en";
  visible: boolean;
  is_mobile_only: boolean;
  tagline: string;
  taglineAr: string;
  showBottomBar: boolean;
  bottomBarText: string;
  bottomBarTextAr: string;
  columns: FooterColumn[];
  bottomLinks: FooterLinkData[];
  backgroundColor: string;
  textColor: string;
};

export const SiteFooter: ComponentConfig<SiteFooterProps> = {
  label: "تذييل الموقع",
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
    tagline: {
      type: "textarea",
      label: "الشعار (إنجليزي)",
    },
    taglineAr: {
      type: "textarea",
      label: "الشعار (عربي)",
    },
    showBottomBar: {
      type: "radio",
      label: "إظهار الشريط السفلي",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    bottomBarText: {
      type: "text",
      label: "نص الشريط السفلي (إنجليزي)",
      placeholder: "e.g. © 2026 Meridian",
    },
    bottomBarTextAr: {
      type: "text",
      label: "نص الشريط السفلي (عربي)",
      placeholder: "مثال: © ٢٠٢٦ متجري",
    },
    columns: {
      type: "array",
      label: "أعمدة التذييل",
      arrayFields: {
        title: { type: "text", label: "عنوان العمود (إنجليزي)" },
        titleAr: { type: "text", label: "عنوان العمود (عربي)" },
        links: {
          type: "array",
          label: "الروابط",
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
        },
      },
      defaultItemProps: {
        title: "New column",
        titleAr: "عمود جديد",
        links: [{ label: "الرابط", labelAr: "رابط", link: EMPTY_LINK }],
      },
      getItemSummary: (item: { title?: string }) => item?.title || "Column",
    } as any,
    bottomLinks: {
      type: "array",
      label: "الروابط السفلية",
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
  },
  defaultProps: {
    title: "",
    variant: "commerce",
    language: "ar",
    visible: true,
    is_mobile_only: false,
    tagline: "",
    taglineAr: "",
    showBottomBar: true,
    bottomBarText: "",
    bottomBarTextAr: "",
    columns: DEFAULT_FOOTER_COLUMNS,
    bottomLinks: DEFAULT_FOOTER_BOTTOM_LINKS,
    backgroundColor: "",
    textColor: "",
  },
  resolveFields: (_data, params) =>
    applyMobileEditorFieldGroups(params.fields, params.metadata),
  render: ({
    title,
    variant,
    language,
    visible,
    is_mobile_only,
    tagline,
    taglineAr,
    showBottomBar,
    bottomBarText,
    bottomBarTextAr,
    columns,
    bottomLinks,
    backgroundColor,
    textColor,
    id,
    puck,
  }) => {
    return (
      <Footer
        siteTitle={title}
        variant={variant}
        columns={columns}
        language={language}
        editMode={!!puck.isEditing}
        componentId={typeof id === "string" ? id : undefined}
        visible={visible}
        isMobileOnly={is_mobile_only}
        showBottomBar={showBottomBar}
        bottomBarText={bottomBarText}
        bottomBarTextAr={bottomBarTextAr}
        tagline={tagline}
        taglineAr={taglineAr}
        bottomLinks={bottomLinks}
        backgroundColor={backgroundColor || undefined}
        textColor={textColor || undefined}
      />
    );
  },
};
