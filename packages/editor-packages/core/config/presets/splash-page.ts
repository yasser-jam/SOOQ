import type { ComponentDataOptionalId } from "@/core/types";
import { SPLASH_HERO_DEFAULT_PROPS } from "../blocks/SplashHero/constants";

/**
 * Splash screens are the mobile app's launch surface — they run *outside* the
 * tab shell, so the page carries no app bar and no footer (see
 * `SitePage.fullScreen`). The mobile converter turns a full-screen page into
 * `{ layout: "centered", padding: 0 }` and adds the route to
 * `shellExcludeRoutes`.
 *
 * The page is mandatory (`config/lib/site-data.ts` seeds and reconciles it on
 * every mobile-mode normalize) and always carries exactly one `SplashHero`
 * block — only its image and colours are authorable, everything else is
 * fixed. See `SplashHero/constants.ts`.
 */
export const SPLASH_PAGE_PATH = "/splash";

export function createSplashPageContent(): ComponentDataOptionalId[] {
  return [
    {
      type: "SplashHero" as const,
      props: { ...SPLASH_HERO_DEFAULT_PROPS },
    },
  ];
}
