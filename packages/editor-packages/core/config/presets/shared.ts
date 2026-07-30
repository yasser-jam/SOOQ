import type { ComponentDataOptionalId } from "@/core/types";

export const PLACEHOLDER_IMAGE =
  "https://placehold.co/800x500/e2e8f0/64748b?text=Preview";

export const HERO_PLACEHOLDER_IMAGE =
  "https://placehold.co/1280x600/1f2937/f8fafc?text=Hero";

export const DEFAULT_YOUTUBE_URL =
  "https://www.youtube.com/watch?v=LXb3EKWsInQ";

type TypographyOverrides = Record<string, unknown>;

export function createHeading(
  text: string,
  overrides: TypographyOverrides = {}
) {
  return {
    type: "ContentHeading" as const,
    props: {
      text,
      textAlign: "left",
      fontFamily: "body",
      fontSize: "theme-2xl",
      fontWeight: "theme-bold",
      lineHeight: "theme-normal",
      fontStyle: "normal",
      textTransform: "none",
      color: "theme-text",
      ...overrides,
    },
  };
}

export function createParagraph(
  text: string,
  overrides: TypographyOverrides = {}
) {
  return {
    type: "ContentParagraph" as const,
    props: {
      text,
      textAlign: "left",
      fontFamily: "body",
      fontSize: "theme-md",
      fontWeight: "theme-normal",
      lineHeight: "theme-relaxed",
      fontStyle: "normal",
      textTransform: "none",
      color: "theme-text",
      ...overrides,
    },
  };
}

export function createInput(
  label: string,
  name: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "ContentInput" as const,
    props: {
      label,
      name,
      inputType: "text",
      placeholder: "",
      required: false,
      ...overrides,
    },
  };
}

export function createSwitch(
  label: string,
  name: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "ContentSwitch" as const,
    props: {
      label,
      name,
      helperText: "",
      defaultChecked: false,
      labelPosition: "start",
      switchAction: "",
      ...overrides,
    },
  };
}

export function createPrimaryButton(
  label: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "ContentButton" as const,
    props: {
      label,
      align: "left",
      destinationType: "link",
      buttonAction: "link",
      link: { kind: "none" },
      buttonVariantMode: "variant",
      buttonVariant: "primary",
      buttonVariantSize: "md",
      radius: "theme-md",
      bgColor: "theme-primary",
      textColor: "theme-surface",
      buttonSize: "theme-md",
      submitRedirectUrl: "",
      ...overrides,
    },
  };
}

export function createContentLink(
  title: string,
  link: Record<string, unknown> = { kind: "none" },
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "ContentLink" as const,
    props: {
      title,
      link,
      align: "right",
      color: "theme-text",
      hoverColor: "theme-primary",
      hoverEffect: "underline",
      fontSize: "theme-sm",
      icon: "none",
      iconPosition: "end",
      ...overrides,
    },
  };
}

export function createHeroButton(
  label: string,
  href = "#",
  variant: "primary" | "secondary" = "primary"
) {
  return { label, href, variant };
}

export function createSection(
  props: Record<string, unknown>
): ComponentDataOptionalId {
  return {
    type: "Section",
    props: {
      columns: 1,
      columnsMobile: 1,
      gridGap: "24px",
      paddingTop: "80px",
      paddingBottom: "80px",
      paddingHorizontal: "24px",
      backgroundColor: "#ffffff",
      theme: "dark",
      maxWidth: "1280px",
      visible: true,
      anchorId: "",
      backgroundImage: "",
      backgroundOverlayColor: "",
      ...props,
    },
  };
}

export function createHeroBlock(
  props: Record<string, unknown>
): ComponentDataOptionalId {
  return {
    type: "Hero",
    props: {
      title: "Hero",
      align: "left",
      description: "<p>Description</p>",
      buttons: [createHeroButton("Learn more")],
      padding: "64px",
      ...props,
    },
  };
}

export function createShellBlock(
  type: "SiteHeader" | "SiteFooter",
  props: Record<string, unknown>
): ComponentDataOptionalId {
  return { type, props };
}
