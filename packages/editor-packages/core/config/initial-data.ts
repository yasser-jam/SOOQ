import { UserData } from "./types";
import { products } from "./data/products";
import { DEFAULT_PRODUCT_CARD_PROPS } from "./blocks/ProductCard";
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
            {
              type: "Grid",
              props: {
                id: "Grid-products",
                gap: 24,
                numColumns: 3,
                items: [
                  {
                    type: "ProductCard",
                    props: {
                      id: "ProductCard-home-1",
                      product: { id: products[0]?.id ?? "", titleAr: products[0]?.title, titleEn: products[0]?.title },
                      ...DEFAULT_PRODUCT_CARD_PROPS,
                      variant: "vertical",
                      layout: {
                        grow: true,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                    },
                  },
                  {
                    type: "ProductCard",
                    props: {
                      id: "ProductCard-home-2",
                      product: { id: products[1]?.id ?? "", titleAr: products[1]?.title, titleEn: products[1]?.title },
                      ...DEFAULT_PRODUCT_CARD_PROPS,
                      variant: "vertical",
                      layout: {
                        grow: true,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                    },
                  },
                  {
                    type: "ProductCard",
                    props: {
                      id: "ProductCard-home-3",
                      product: { id: products[2]?.id ?? "", titleAr: products[2]?.title, titleEn: products[2]?.title },
                      ...DEFAULT_PRODUCT_CARD_PROPS,
                      variant: "vertical",
                      layout: {
                        grow: true,
                        spanCol: 1,
                        spanRow: 1,
                        padding: "0px",
                      },
                    },
                  },
                ],
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
    content: [
      {
        type: "Section",
        props: {
          id: "Section-cart-header",
          paddingTop: "64px",
          paddingBottom: "64px",
          paddingHorizontal: "48px",
          backgroundColor: "#ffffff",
          theme: "light",
          maxWidth: "900px",
          content: [
            {
              type: "Heading",
              props: {
                id: "Heading-cart-title",
                align: "left",
                level: "1",
                text: "Your Cart",
                size: "xxl",
                layout: { padding: "0px" },
                colorMode: "theme",
                colorTheme: "text",
                colorFixed: "#0f172a",
              },
            },
            {
              type: "Space",
              props: {
                id: "Space-cart-1",
                size: "12px",
                direction: "vertical",
              },
            },
            {
              type: "Text",
              props: {
                id: "Text-cart-sub",
                align: "left",
                text: "Review the items in your cart before checkout.",
                size: "m",
                color: "muted",
                layout: { padding: "0px" },
              },
            },
          ],
        },
      },
    ],
  },

  // ── Product details page (example slug) ───────────────────────────────────
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
    content: [
      {
        type: "Section",
        props: {
          id: "Section-product-detail",
          paddingTop: "64px",
          paddingBottom: "64px",
          paddingHorizontal: "48px",
          backgroundColor: "#ffffff",
          theme: "light",
          maxWidth: "1200px",
          content: [
            {
              type: "ProductCard",
              props: {
                id: "ProductCard-detail",
                product: { id: "prod-001", titleAr: "Classic White Sneakers", titleEn: "Classic White Sneakers" },
                ...DEFAULT_PRODUCT_CARD_PROPS,
                variant: "horizontal",
                layout: {
                  grow: true,
                  spanCol: 1,
                  spanRow: 1,
                  padding: "0px",
                },
              },
            },
          ],
        },
      },
    ],
  },
};
