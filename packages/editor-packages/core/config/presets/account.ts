import type { ComponentDataOptionalId } from "@/core/types";
import type { SectionPreset } from "./types";
import {
  buildCustomerAccountSectionProps,
  buildCustomerAddressesSectionProps,
} from "../blocks/Section/section-preset-kinds";
import {
  createContentLink,
  createHeading,
  createInput,
  createParagraph,
  createPrimaryButton,
  createSection,
  createSwitch,
} from "./shared";

function createRowGroup(content: ComponentDataOptionalId[]) {
  return {
    type: "RowGroup" as const,
    props: {
      direction: "row",
      gap: 16,
      alignItems: "center",
      justifyContent: "space-between",
      wrap: "wrap",
      content,
    },
  };
}

function createAccountGroup(
  content: ComponentDataOptionalId[],
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "Group" as const,
    props: {
      direction: "column",
      gap: 16,
      alignItems: "stretch",
      justifyContent: "flex-start",
      wrap: "nowrap",
      language: "ar",
      backgroundColor: "",
      backgroundImage: "",
      backgroundOverlayColor: "",
      padding: "24px",
      borderRadius: "theme-md",
      boxShadow: "none",
      product: null,
      metadata: null,
      cartLineId: null,
      content,
      ...overrides,
    },
  };
}

const accountProfilePreset: SectionPreset = {
  id: "account-profile",
  category: "account",
  title: "الملف الشخصي",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=Account+Profile",
  componentData: createSection({
    ...buildCustomerAccountSectionProps(),
    showCondition: "loggedIn",
    content: [
      createAccountGroup([
        createHeading("المعلومات الشخصية"),
        createRowGroup([
          createParagraph("عدد الطلبات"),
          createParagraph("", {
            valueContext: { path: "profile.orderCount" },
          }),
        ]),
        createRowGroup([
          createParagraph("إجمالي الإنفاق"),
          createParagraph("", {
            valueContext: { path: "profile.totalSpendSyp" },
          }),
        ]),
        createInput("الاسم الكامل", "fullName", {
          inputAction: "profile_full_name",
        }),
        createInput("رقم الهاتف", "phone", {
          inputType: "tel",
          inputAction: "",
          valueContext: { path: "profile.phone" },
        }),
        createPrimaryButton("حفظ التغييرات", {
          align: "center",
          destinationType: "action",
          buttonAction: "saveProfile",
        }),
      ]),
    ],
  }),
};

const accountMarketingPreset: SectionPreset = {
  id: "account-marketing",
  category: "account",
  title: "تفضيلات التسويق",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=Marketing+Prefs",
  componentData: createSection({
    ...buildCustomerAccountSectionProps(),
    showCondition: "loggedIn",
    content: [
      createAccountGroup([
        createHeading("تفضيلات التسويق"),
        createParagraph("اختر كيف تحب أن نصلك بالعروض."),
        createSwitch("رسائل البريد الإلكتروني", "email-opt-in", {
          switchAction: "marketing_email_opt_in",
        }),
        createSwitch("الرسائل النصية", "sms-opt-in", {
          switchAction: "marketing_sms_opt_in",
        }),
      ]),
    ],
  }),
};

const accountAddressesPreset: SectionPreset = {
  id: "account-addresses",
  category: "account",
  title: "عناويني",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=My+Addresses",
  componentData: createSection({
    ...buildCustomerAddressesSectionProps(),
    showCondition: "loggedIn",
    content: [
      createAccountGroup(
        [
          createHeading("", {
            valueContext: { path: "address.label" },
          }),
          createParagraph("", {
            valueContext: { path: "address.governorate" },
          }),
          createParagraph("", {
            valueContext: { path: "address.city" },
          }),
          createParagraph("", {
            valueContext: { path: "address.streetAddress" },
          }),
          createRowGroup([
            createPrimaryButton("تعيين كافتراضي", {
              destinationType: "action",
              buttonAction: "setDefaultAddress",
              buttonVariant: "secondary",
            }),
            createPrimaryButton("حذف", {
              destinationType: "action",
              buttonAction: "deleteAddress",
              buttonVariant: "error",
            }),
          ]),
        ],
        { id: "Group-settings-address-row" }
      ),
    ],
  }),
};

const accountAddressFormPreset: SectionPreset = {
  id: "account-address-form",
  category: "account",
  title: "إضافة عنوان جديد",
  previewImage:
    "https://placehold.co/480x360/ffffff/64748b?text=Add+Address",
  componentData: createSection({
    ...buildCustomerAccountSectionProps(),
    showCondition: "loggedIn",
    content: [
      createAccountGroup([
        createHeading("إضافة عنوان جديد"),
        {
          type: "ContentMap",
          props: {
            heightPx: 260,
            zoom: 13,
            defaultLat: 33.5138,
            defaultLng: 36.2765,
            interactive: true,
            mapAction: "address_draft_location",
          },
        },
        createInput("التسمية", "address-label", {
          inputAction: "address_label",
        }),
        createInput("اسم المستلم", "address-recipient-name", {
          inputAction: "address_recipient_name",
        }),
        createInput("رقم هاتف المستلم", "address-recipient-phone", {
          inputType: "tel",
          inputAction: "address_recipient_phone",
        }),
        createInput("المحافظة", "address-governorate", {
          inputAction: "address_governorate",
        }),
        createInput("المدينة", "address-city", {
          inputAction: "address_city",
        }),
        createInput("العنوان التفصيلي", "address-street", {
          inputAction: "address_street",
        }),
        createInput("ملاحظات", "address-notes", {
          inputAction: "address_notes",
        }),
        createSwitch("تعيين كعنوان افتراضي", "address-is-default", {
          switchAction: "address_is_default",
        }),
        createPrimaryButton("حفظ العنوان", {
          align: "center",
          destinationType: "action",
          buttonAction: "createAddress",
        }),
      ]),
    ],
  }),
};

export const ACCOUNT_PRESETS: SectionPreset[] = [
  accountProfilePreset,
  accountMarketingPreset,
  accountAddressesPreset,
  accountAddressFormPreset,
];

export function createSettingsPageContent(): ComponentDataOptionalId[] {
  return [
    createSection({
      id: "Section-settings-signedout",
      name: "تسجيل الدخول",
      showCondition: "loggedOut",
      maxWidth: "640px",
      paddingTop: "48px",
      paddingBottom: "24px",
      content: [
        createAccountGroup([
          createHeading("سجّل دخولك لعرض إعدادات حسابك.", {
            textAlign: "center",
          }),
          createParagraph("يمكنك تسجيل الدخول برقم هاتفك لمتابعة طلباتك وإدارة حسابك.", {
            textAlign: "center",
          }),
          createContentLink("تسجيل الدخول", {
            kind: "page",
            pageId: "/login",
          }),
        ]),
      ],
    }),
    createSection({
      id: "Section-settings-profile",
      name: "الملف الشخصي",
      showCondition: "loggedIn",
      maxWidth: "720px",
      paddingTop: "24px",
      paddingBottom: "24px",
      ...buildCustomerAccountSectionProps(),
      content: accountProfilePreset.componentData.props?.content ?? [],
    }),
    createSection({
      id: "Section-settings-marketing",
      name: "تفضيلات التسويق",
      showCondition: "loggedIn",
      maxWidth: "720px",
      paddingTop: "24px",
      paddingBottom: "24px",
      ...buildCustomerAccountSectionProps(),
      content: accountMarketingPreset.componentData.props?.content ?? [],
    }),
    createSection({
      id: "Section-settings-addresses",
      name: "عناويني",
      showCondition: "loggedIn",
      maxWidth: "720px",
      paddingTop: "24px",
      paddingBottom: "24px",
      ...buildCustomerAddressesSectionProps(),
      content: accountAddressesPreset.componentData.props?.content ?? [],
    }),
    createSection({
      id: "Section-settings-address-form",
      name: "إضافة عنوان جديد",
      showCondition: "loggedIn",
      maxWidth: "720px",
      paddingTop: "24px",
      paddingBottom: "48px",
      ...buildCustomerAccountSectionProps(),
      content: accountAddressFormPreset.componentData.props?.content ?? [],
    }),
  ];
}
