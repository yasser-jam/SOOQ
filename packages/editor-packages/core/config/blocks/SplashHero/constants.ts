/**
 * SplashHero is the mobile app's launch screen. Everything except the image and the six colour
 * fields below is fixed by contract with the mobile engine (`docs/orders-mobile-conversion.md`'s
 * sibling doc for pages — see `apps/web/lib/transformer.ts`'s `transformSplashHero`), so those
 * fixed values are not exposed as Puck fields at all: `icons`, `headline`, `buttonLabel` and `tap`
 * are baked into `defaultProps` and never change.
 */

export type SplashHeroIcon = {
  name: string;
  color: string;
  background?: string;
};

export type SplashHeroTap = {
  type: "navigate";
  route: string;
  navigation_type: "push" | "replace" | "clear_stack";
};

export type SplashHeroProps = {
  image: string;
  imageFit: "contain" | "cover";
  background: string;
  decorColor: string;
  accentColor: string;
  icons: SplashHeroIcon[];
  headline: string;
  headlineColor: string;
  buttonLabel: string;
  buttonColor: string;
  buttonTextColor: string;
  tap: SplashHeroTap;
};

/** Editable via the property panel: the image and the six colours. Everything else is locked. */
export const SPLASH_HERO_EDITABLE_KEYS = [
  "image",
  "background",
  "decorColor",
  "accentColor",
  "headlineColor",
  "buttonColor",
  "buttonTextColor",
] as const satisfies readonly (keyof SplashHeroProps)[];

export const SPLASH_HERO_PLACEHOLDER_IMAGE =
  "https://placehold.co/440x440/132a4f/e8912b?text=Splash";

/** Matches `mobile_production_v2`'s reference splash — see BLOCKS-MOBILE.md "Full-screen pages & splash". */
export const SPLASH_HERO_DEFAULT_PROPS: SplashHeroProps = {
  image: SPLASH_HERO_PLACEHOLDER_IMAGE,
  imageFit: "contain",
  background: "#132A4F",
  decorColor: "#2A3F63",
  accentColor: "#E8912B",
  icons: [
    { name: "shopping_cart", color: "#12244A" },
    { name: "smartphone", color: "#FFFFFF", background: "#E8912B" },
    { name: "palette", color: "#12244A" },
    { name: "inventory_2", color: "#12244A" },
    { name: "local_shipping", color: "#12244A" },
    { name: "bookmark", color: "#12244A" },
  ],
  headline: "تسوق.. اختر, واستلم",
  headlineColor: "#FFFFFF",
  buttonLabel: "ابدأ الآن",
  buttonColor: "#D7DCE5",
  buttonTextColor: "#12244A",
  tap: { type: "navigate", route: "/home", navigation_type: "clear_stack" },
};

/** Merge whatever the merchant changed (image + colours) onto the locked defaults. */
export function reconcileSplashHeroProps(
  authored: Record<string, unknown> | null | undefined
): SplashHeroProps {
  const props = authored ?? {};
  const pick = (key: (typeof SPLASH_HERO_EDITABLE_KEYS)[number]) => {
    const value = props[key];
    return typeof value === "string" && value.trim() !== ""
      ? value
      : SPLASH_HERO_DEFAULT_PROPS[key];
  };

  return {
    ...SPLASH_HERO_DEFAULT_PROPS,
    image: pick("image"),
    background: pick("background"),
    decorColor: pick("decorColor"),
    accentColor: pick("accentColor"),
    headlineColor: pick("headlineColor"),
    buttonColor: pick("buttonColor"),
    buttonTextColor: pick("buttonTextColor"),
  };
}
