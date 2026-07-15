import type { ComponentDataOptionalId } from "@/core/types";
import type { HeaderPresetLayout, ZonePreset } from "./types";
import { createPrimaryButton } from "./shared";
import {
  CART_ICON_BUTTON,
  createBurgerButton,
  createHeaderBrandTitle,
  createHeaderNavLinksGroup,
  createHeaderRowSection,
  createHeaderSlotGroup,
  HEADER_GROUP_DEFAULTS,
} from "./zone-shell";

export type HeaderLayoutId = HeaderPresetLayout;

export type HeaderLayoutOption = {
  id: string;
  layout: HeaderLayoutId;
  title: string;
  description: string;
  previewImage: string;
};

export const HEADER_LAYOUT_OPTIONS: HeaderLayoutOption[] = [
  {
    id: "header-logo-right-links-left",
    layout: "logo-right-links-left",
    title: "شعار يمين — روابط يسار",
    description: "الشعار على اليمين وروابط التنقل على اليسار",
    previewImage:
      "https://placehold.co/800x240/f8fafc/64748b?text=Logo+Right+%7C+Links+Left",
  },
  {
    id: "header-logo-center-actions",
    layout: "logo-center-actions",
    title: "شعار وسط — روابط وزر دخول",
    description: "الشعار في الوسط، الروابط يساراً، وتسجيل الدخول يميناً",
    previewImage:
      "https://placehold.co/800x240/ffffff/64748b?text=Logo+Center+%7C+Login",
  },
  {
    id: "header-logo-left-links-center",
    layout: "logo-left-links-center",
    title: "شعار يسار — روابط وسط",
    description: "الشعار على اليسار والروابط في الوسط",
    previewImage:
      "https://placehold.co/800x240/f8fafc/64748b?text=Logo+Left+%7C+Links+Center",
  },
  {
    id: "header-responsive-commerce",
    layout: "logo-right-burger-left",
    title: "رأس متجاوب — قائمة جوال",
    description:
      "سطح المكتب: شعار + روابط تنقل. الجوال: شعار + زر قائمة يفتح الدرج الجانبي",
    previewImage:
      "https://placehold.co/800x240/f0f9ff/0284c7?text=Responsive+Header",
  },
];

/** @deprecated Use HEADER_LAYOUT_OPTIONS */
export const HEADER_LAYOUT_DEFINITIONS = HEADER_LAYOUT_OPTIONS.map(
  ({ layout, title, description }) => ({
    layout,
    label: title,
    description,
  })
);

function createHeaderLoginButton() {
  return createPrimaryButton("تسجيل الدخول", {
    destinationType: "action",
    buttonAction: "login",
    submitRedirectUrl: "/verify-otp",
    buttonVariantSize: "sm",
  });
}

function createHeaderGrowGroup(
  content: unknown[],
  justifyContent: "flex-start" | "center" | "flex-end" = "center"
) {
  return {
    type: "Group" as const,
    props: {
      ...HEADER_GROUP_DEFAULTS,
      direction: "row",
      gap: 12,
      alignItems: "center",
      justifyContent,
      wrap: "nowrap",
      layout: { grow: true, spanCol: 1, spanRow: 1, padding: "0px" },
      content,
    },
  };
}

export function buildHeaderZoneSection(
  layout: HeaderLayoutId
): ComponentDataOptionalId {
  const brand = createHeaderBrandTitle("متجري");
  const links = createHeaderNavLinksGroup("plain", {
    justifyContent: "flex-start",
  });

  let rowContent: unknown[];

  // DOM order follows RTL flex (site default): first = visual right, last = visual left.
  switch (layout) {
    case "logo-right-links-left":
      rowContent = [brand, links];
      break;
    case "logo-center-actions":
      rowContent = [
        createHeaderGrowGroup([createHeaderLoginButton()], "flex-start"),
        createHeaderGrowGroup([brand], "center"),
        links,
      ];
      break;
    case "logo-left-links-center":
      rowContent = [
        createHeaderSlotGroup([]),
        createHeaderGrowGroup(
          [
            createHeaderNavLinksGroup("plain", {
              justifyContent: "center",
            }),
          ],
          "center"
        ),
        brand,
      ];
      break;
    case "logo-right-burger-left": {
      // On desktop: brand + nav links (hidden on mobile) + cart icon.
      // On mobile: brand + cart icon + burger button (hidden on desktop).
      // Nav links Group carries layout.hideOnMobile so it disappears on small screens.
      // Burger button carries layout.hideOnDesktop so it disappears on large screens.
      const desktopLinks = createHeaderNavLinksGroup("plain", {
        justifyContent: "flex-start",
        layout: { hideOnMobile: true, hideOnDesktop: false, hideOnTablet: false },
      });
      const burger = createBurgerButton("site-drawer");
      rowContent = [
        brand,
        desktopLinks,
        createHeaderSlotGroup([CART_ICON_BUTTON, burger]),
      ];
      break;
    }
  }

  return createHeaderRowSection(
    {
      backgroundColor: "#ffffff",
      theme: "dark",
    },
    rowContent
  );
}

export function headerLayoutOptionToPreset(
  option: HeaderLayoutOption
): ZonePreset {
  return {
    id: option.id,
    category: "zone-header",
    title: option.title,
    previewImage: option.previewImage,
    headerLayout: option.layout,
    componentData: buildHeaderZoneSection(option.layout),
  };
}

export function getDefaultHeaderLayoutOption(): HeaderLayoutOption {
  return HEADER_LAYOUT_OPTIONS[0]!;
}
