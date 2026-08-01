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
import { showConditionField } from "../../lib/show-condition";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";

export type SiteFooterProps = {
  title: BilingualString | string;
  variant: ShellVariant;
  language: "ar" | "en";
  visible: boolean;
  is_mobile_only: boolean;
  tagline: BilingualString | string;
  showBottomBar: boolean;
  bottomBarText: BilingualString | string;
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
    title: bilingualTextField({ label: "عنوان العلامة التجارية" }),
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
    tagline: bilingualTextField({ label: "الشعار", mode: "textarea" }),
    showBottomBar: {
      type: "radio",
      label: "إظهار الشريط السفلي",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    bottomBarText: bilingualTextField({
      label: "نص الشريط السفلي",
      placeholderAr: "مثال: © ٢٠٢٦ متجري",
      placeholderEn: "e.g. © 2026 Meridian",
    }),
    columns: {
      type: "array",
      label: "أعمدة التذييل",
      arrayFields: {
        title: bilingualTextField({ label: "عنوان العمود" }),
        links: {
          type: "array",
          label: "الروابط",
          arrayFields: {
            label: bilingualTextField({ label: "التسمية" }),
            link: linkField({ label: "الوجهة" }),
            showCondition: showConditionField,
          },
          defaultItemProps: {
            label: { ar: "عنصر", en: "New link" } as BilingualString,
            link: EMPTY_LINK,
            showCondition: "always",
          },
          getItemSummary: (item: FooterLinkData) =>
            pickLang(item?.label) || "Link",
        },
      },
      defaultItemProps: {
        title: { ar: "عمود جديد", en: "New column" } as BilingualString,
        links: [
          {
            label: { ar: "رابط", en: "Link" } as BilingualString,
            link: EMPTY_LINK,
          },
        ],
      },
      getItemSummary: (item: FooterColumn) =>
        pickLang(item?.title) || "Column",
    } as any,
    bottomLinks: {
      type: "array",
      label: "الروابط السفلية",
      arrayFields: {
        label: bilingualTextField({ label: "التسمية" }),
        link: linkField({ label: "الوجهة" }),
      },
      defaultItemProps: {
        label: { ar: "عنصر", en: "New link" } as BilingualString,
        link: EMPTY_LINK,
      },
      getItemSummary: (item: FooterLinkData) =>
        pickLang(item?.label) || "Link",
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
    title: { ar: "", en: "" },
    variant: "commerce",
    language: "ar",
    visible: true,
    is_mobile_only: false,
    tagline: { ar: "", en: "" },
    showBottomBar: true,
    bottomBarText: { ar: "", en: "" },
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
    showBottomBar,
    bottomBarText,
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
        tagline={tagline}
        bottomLinks={bottomLinks}
        backgroundColor={backgroundColor || undefined}
        textColor={textColor || undefined}
      />
    );
  },
};
