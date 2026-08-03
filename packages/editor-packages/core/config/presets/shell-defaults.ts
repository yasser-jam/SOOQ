/**
 * Plain JSON defaults for shell presets.
 * Kept separate from Header/Footer client components to avoid a circular import:
 * LinkField → @/core → plugins/blocks → presets → Header → LinkField
 */

export const PRESET_HEADER_LINKS = [
  {
    label: "Home",
    labelAr: "الرئيسية",
    link: { kind: "page", pageId: "/" },
  },
  {
    label: "Shop",
    labelAr: "المتجر",
    link: { kind: "page", pageId: "/products" },
  },
  {
    label: "Themes",
    labelAr: "القوالب",
    link: { kind: "page", pageId: "/themes" },
  },
  {
    label: "Sign in",
    labelAr: "تسجيل الدخول",
    link: { kind: "page", pageId: "/login" },
    showCondition: "loggedOut" as const,
  },
] as const;

export const PRESET_FOOTER_BOTTOM_LINKS = [
  {
    label: "Privacy",
    labelAr: "الخصوصية",
    link: { kind: "page", pageId: "/privacy" },
  },
  {
    label: "Terms",
    labelAr: "الشروط",
    link: { kind: "page", pageId: "/terms" },
  },
] as const;

export const PRESET_FOOTER_COLUMNS = [
  {
    title: "Shop",
    titleAr: "المتجر",
    links: [
      {
        label: "Home",
        labelAr: "الرئيسية",
        link: { kind: "page", pageId: "/" },
      },
      {
        label: "Products",
        labelAr: "المنتجات",
        link: { kind: "page", pageId: "/products" },
      },
      {
        label: "Cart",
        labelAr: "السلة",
        link: { kind: "page", pageId: "/cart" },
      },
    ],
  },
  {
    title: "Explore",
    titleAr: "استكشف",
    links: [
      {
        label: "Themes",
        labelAr: "القوالب",
        link: { kind: "page", pageId: "/themes" },
      },
      {
        label: "Pricing",
        labelAr: "الأسعار",
        link: { kind: "page", pageId: "/pricing" },
      },
      {
        label: "About",
        labelAr: "من نحن",
        link: { kind: "page", pageId: "/about" },
      },
    ],
  },
  {
    title: "Support",
    titleAr: "الدعم",
    links: [
      {
        label: "Shipping",
        labelAr: "الشحن",
        link: { kind: "anchor", hash: "shipping" },
      },
      {
        label: "Returns",
        labelAr: "الإرجاع",
        link: { kind: "anchor", hash: "returns" },
      },
      {
        label: "Contact",
        labelAr: "اتصل بنا",
        link: { kind: "anchor", hash: "contact" },
      },
    ],
  },
] as const;
