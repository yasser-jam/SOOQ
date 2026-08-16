import type { ComponentDataOptionalId } from "@/core/types";
import { createHeading, createPrimaryButton, createSection } from "./shared";

/**
 * Splash screens are the mobile app's launch surface — they run *outside* the
 * tab shell, so the page carries no app bar and no footer (see
 * `SitePage.fullScreen`). The mobile converter turns a full-screen page into
 * `{ layout: "centered", padding: 0 }` and adds the route to
 * `shellExcludeRoutes`.
 *
 * Only the plain variant (image + headline + CTA) is authorable today; the
 * onboarding carousel needs a stepper block that does not exist yet.
 */
export type SplashVariantId = "basic" | "onboarding";

export const SPLASH_PAGE_PATH = "/splash";

export const SPLASH_PLACEHOLDER_IMAGE =
  "https://placehold.co/440x440/132a4f/e8912b?text=Splash";

/** Deep navy used by the reference splash — merchants recolor the Section. */
const SPLASH_BACKGROUND = "#132A4F";

export function createSplashPageContent(): ComponentDataOptionalId[] {
  return [
    createSection({
      name: "شاشة البداية",
      backgroundColor: SPLASH_BACKGROUND,
      theme: "light",
      maxWidth: "480px",
      columns: 1,
      columnsMobile: 1,
      gridGap: "24px",
      // No app bar or footer eats into the viewport, so the band itself carries
      // the vertical breathing room that makes the logo read as centered.
      paddingTop: "120px",
      paddingBottom: "120px",
      paddingHorizontal: "24px",
      content: [
        {
          type: "Flex",
          props: {
            direction: "column",
            justifyContent: "center",
            gap: 24,
            wrap: "nowrap",
            items: [
              {
                type: "ContentImage",
                props: {
                  src: SPLASH_PLACEHOLDER_IMAGE,
                  alt: { ar: "شعار المتجر", en: "Store logo" },
                  align: "center",
                  objectFit: "contain",
                  radius: "theme-md",
                  maxWidth: "220px",
                },
              },
              createHeading("تسوّق.. اختر واستلم", {
                level: "1",
                textAlign: "center",
                fontSize: "theme-2xl",
                color: "#FFFFFF",
              }),
              createPrimaryButton("ابدأ الآن", {
                align: "center",
                link: { kind: "page", pageId: "/" },
                buttonVariantMode: "fixed",
                bgColor: "#D7DCE5",
                textColor: "#12244A",
              }),
            ],
          },
        },
      ],
    }),
  ];
}

export type SplashVariant = {
  id: SplashVariantId;
  label: string;
  description: string;
  /** Absent while the variant is not authorable yet. */
  create?: () => ComponentDataOptionalId[];
};

export const SPLASH_VARIANTS: SplashVariant[] = [
  {
    id: "basic",
    label: "شاشة بداية عادية",
    description: "صورة في المنتصف مع عنوان وزر بدء.",
    create: createSplashPageContent,
  },
  {
    id: "onboarding",
    label: "شاشة تعريفية متعددة الخطوات (قريبًا)",
    description: "شرائح تعريفية بمؤشر خطوات — بحاجة إلى بلوك stepper.",
  },
];

export function getSplashVariant(
  id: SplashVariantId
): SplashVariant | undefined {
  return SPLASH_VARIANTS.find((variant) => variant.id === id);
}
