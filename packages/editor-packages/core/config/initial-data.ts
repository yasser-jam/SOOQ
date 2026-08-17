import { UserData } from "./types";
import { products } from "./data/products";
import { createProductDetailSection } from "./presets/products-grid";
import { createCartPageContent } from "./presets/cart";
import { createCheckoutPageContent } from "./presets/checkout";
import { createSettingsPageContent } from "./presets/account";
import {
  createCancelOrderZonePopup,
  createOrderDetailPageContent,
  createOrdersPageContent,
} from "./presets/orders";
import {
  buildThemesGalleryData,
  buildAllThemeDemoInitialEntries,
} from "./theme-presets";

export const initialData: Record<string, UserData> = {
  "/": {
    root: {
      props: {
        title: "Meridian Co.",
        bodyFont: "system",
        fontOption1: "system",
        fontOption2: "system",
      },
    },
    zones: {},
    content: [
      // ── Hero: store name + primary CTA ───────────────────────────────────
      {
        type: "Section",
        props: {
          id: "Section-hero",
          paddingTop: "0px",
          paddingBottom: "0px",
          paddingHorizontal: "0px",
          backgroundColor: "#ffffff",
          theme: "dark",
          maxWidth: "100%",
          content: [
            {
              type: "Hero",
              props: {
                id: "Hero-store",
                title: "Meridian Co.",
                description:
                  "<p>Thoughtfully curated apparel, tech, and home goods — free shipping on orders over $50.</p>",
                buttons: [
                  {
                    label: "Shop the collection",
                    href: "/products/example-product",
                    variant: "primary",
                  },
                  {
                    label: "View cart",
                    href: "/cart",
                    variant: "secondary",
                  },
                ],
                image: {
                  url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80",
                  mode: "inline",
                  content: [],
                },
                padding: "120px",
                align: "left",
              },
              readOnly: { title: false, description: false },
            },
          ],
        },
      },

      // ── Featured products grid ───────────────────────────────────────────
      {
        type: "Section",
        props: {
          id: "Section-products",
          paddingTop: "96px",
          paddingBottom: "96px",
          paddingHorizontal: "24px",
          backgroundColor: "#f8f9fa",
          theme: "dark",
          maxWidth: "1280px",
          content: [
            {
              type: "Heading",
              props: {
                id: "Heading-featured",
                align: "center",
                level: "2",
                text: "Featured products",
                fontFamily: "option1",
                layout: { padding: "0px" },
                size: "xxl",
                colorMode: "theme",
                colorTheme: "text",
                colorFixed: "#0f172a",
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-products-sub",
                size: "12px",
                direction: "vertical",
              },
            },
            {
              type: "Text",
              props: {
                id: "Text-products-sub",
                align: "center",
                text: "Hand-picked bestsellers from this week.",
                layout: { padding: "0px" },
                size: "m",
                color: "muted",
                fontFamily: "body",
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-products-grid",
                size: "40px",
                direction: "vertical",
              },
            },
          ],
        } as any,
      },

      // ── About: image left, copy right ────────────────────────────────────
      {
        type: "Section",
        props: {
          id: "Section-about",
          paddingTop: "96px",
          paddingBottom: "96px",
          paddingHorizontal: "24px",
          backgroundColor: "#ffffff",
          theme: "dark",
          maxWidth: "1280px",
          content: [
            {
              type: "Group",
              props: {
                id: "Group-about-row",
                direction: "row",
                gap: 48,
                alignItems: "center",
                justifyContent: "flex-start",
                wrap: "wrap",
                layout: { padding: "0px" },
                content: [
                  {
                    type: "ProductImage",
                    props: {
                      id: "ProductImage-about",
                      product: { id: products[3]?.id ?? "", titleAr: products[3]?.title, titleEn: products[3]?.title },
                      aspectRatio: "landscape",
                      width: "400px",
                      borderRadius: "lg",
                      showBadges: false,
                      layout: {
                        grow: false,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                    },
                  },
                  {
                    type: "Group",
                    props: {
                      id: "Group-about-copy",
                      direction: "column",
                      gap: 16,
                      alignItems: "flex-start",
                      justifyContent: "center",
                      wrap: "nowrap",
                      layout: {
                        grow: true,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                      content: [
                        {
                          type: "Heading",
                          props: {
                            id: "Heading-about",
                            align: "left",
                            level: "2",
                            text: "Crafted for everyday life",
                            fontFamily: "option1",
                            layout: { padding: "0px" },
                            size: "xl",
                            colorMode: "theme",
                            colorTheme: "text",
                            colorFixed: "#0f172a",
                          },
                        },
                        {
                          type: "Text",
                          props: {
                            id: "Text-about",
                            align: "left",
                            text: "Meridian Co. started in a small studio with one goal: bring you products that look good, work hard, and respect the planet. We partner with independent makers and audit every item for quality and ethics.",
                            layout: { padding: "0px" },
                            size: "m",
                            color: "default",
                            fontFamily: "body",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },

      // ── CTA: centered title + button, fixed background image ─────────────
      {
        type: "Section",
        props: {
          id: "Section-cta-hero",
          paddingTop: "0px",
          paddingBottom: "0px",
          paddingHorizontal: "0px",
          backgroundColor: "transparent",
          theme: "dark",
          maxWidth: "100%",
          content: [
            {
              type: "Hero",
              props: {
                id: "Hero-cta",
                title: "New arrivals every week",
                description:
                  "<p>Sign up for restock alerts and get 15% off your first order when you spend $75 or more.</p>",
                buttons: [
                  {
                    label: "Start shopping",
                    href: "/products/example-product",
                    variant: "primary",
                  },
                ],
                align: "center",
                image: {
                  url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=2000&auto=format&fit=crop&q=80",
                  mode: "background",
                  backgroundAttachment: "fixed",
                  content: [],
                },
                padding: "120px",
              },
              readOnly: { title: false, description: false },
            },
          ],
        },
      },
    ],
  },

  ...buildAllThemeDemoInitialEntries(),

  "/themes": buildThemesGalleryData(),

  "/pricing": {
    content: [],
    root: { props: { title: "Pricing", bodyFont: "system", fontOption1: "system", fontOption2: "system" } },
  },

  "/about": {
    content: [],
    root: { props: { title: "About Us", bodyFont: "system", fontOption1: "system", fontOption2: "system" } },
  },

  // ── Cart page ─────────────────────────────────────────────────────────────
  "/cart": {
    root: {
      props: {
        title: "Cart",
        bodyFont: "system",
        fontOption1: "system",
        fontOption2: "system",
      },
    },
    zones: {},
    content: createCartPageContent(),
  },

  "/checkout": {
    root: {
      props: {
        title: "Checkout",
        bodyFont: "system",
        fontOption1: "system",
        fontOption2: "system",
      },
    },
    zones: {},
    content: createCheckoutPageContent(),
  },

  "/settings": {
    root: {
      props: {
        title: "Account Settings",
        bodyFont: "system",
        fontOption1: "system",
        fontOption2: "system",
      },
    },
    zones: {},
    content: createSettingsPageContent(),
  },

  "/orders": {
    root: {
      props: {
        title: "Orders",
        bodyFont: "system",
        fontOption1: "system",
        fontOption2: "system",
      },
    },
    zones: {},
    content: createOrdersPageContent(),
  },

  "/orders/example-order": {
    root: {
      props: {
        title: "Order Details",
        bodyFont: "system",
        fontOption1: "system",
        fontOption2: "system",
      },
    },
    zones: {
      "root:zone-popup": [createCancelOrderZonePopup() as UserData["content"][number]],
    },
    content: createOrderDetailPageContent(),
  },

  // ── Product details page (dynamic /products/:product-slug) ──────────────
  // Renderer wraps this page in <UrlBoundProductProvider slug={...}> so the
  // product-detail section's bound blocks inherit the URL slug's product.
  "/products/example-product": {
    root: {
      props: {
        title: "Product Details",
        bodyFont: "system",
        fontOption1: "system",
        fontOption2: "system",
      },
    },
    zones: {},
    content: [createProductDetailSection() as UserData["content"][number]],
  },
};
