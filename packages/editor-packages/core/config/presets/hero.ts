import type { SectionPreset } from "./types";
import {
  DEFAULT_YOUTUBE_URL,
  HERO_PLACEHOLDER_IMAGE,
  PLACEHOLDER_IMAGE,
  createHeading,
  createHeroBlock,
  createHeroButton,
  createParagraph,
  createPrimaryButton,
  createSection,
} from "./shared";

/** Hero with Section background image + centered copy */
const heroBgImage: SectionPreset = {
  id: "hero-bg-image",
  category: "hero",
  title: "هيرو بصورة خلفية",
  previewImage: HERO_PLACEHOLDER_IMAGE,
  componentData: createSection({
    name: "Hero",
    paddingTop: "120px",
    paddingBottom: "120px",
    paddingHorizontal: "24px",
    maxWidth: "100%",
    backgroundColor: "#0f172a",
    backgroundImage:
      "https://placehold.co/1280x600/334155/f8fafc?text=Background",
    backgroundOverlayColor: "rgba(0, 0, 0, 0.45)",
    theme: "light",
    content: [
      {
        type: "Group",
        props: {
          direction: "column",
          gap: 20,
          alignItems: "center",
          justifyContent: "center",
          wrap: "nowrap",
          content: [
            createHeading("Big headline", {
              textAlign: "center",
              color: "theme-surface",
            }),
            createParagraph(
              "Supporting text that reinforces your message and invites visitors to explore.",
              {
                textAlign: "center",
                fontSize: "theme-lg",
                color: "theme-surface",
              }
            ),
            createPrimaryButton("Get started", { align: "center" }),
          ],
        },
      },
    ],
  }),
};

/** Hero with full-width YouTube embed + centered copy below */
const heroBgVideo: SectionPreset = {
  id: "hero-bg-video",
  category: "hero",
  title: "هيرو بفيديو يوتيوب",
  previewImage: "https://placehold.co/1280x600/111827/f8fafc?text=Video",
  componentData: createSection({
    name: "Hero video",
    paddingTop: "0px",
    paddingBottom: "64px",
    paddingHorizontal: "0px",
    maxWidth: "100%",
    backgroundColor: "#0f172a",
    theme: "light",
    content: [
      {
        type: "VideoEmbed",
        props: {
          src: DEFAULT_YOUTUBE_URL,
          align: "center",
          size: "720",
          radius: "theme-none",
        },
      },
      {
        type: "Group",
        props: {
          direction: "column",
          gap: 20,
          alignItems: "center",
          justifyContent: "center",
          wrap: "nowrap",
          padding: "48px",
          content: [
            createHeading("Big headline", {
              textAlign: "center",
              color: "theme-surface",
            }),
            createParagraph(
              "Replace the YouTube URL and edit the headline for your campaign.",
              {
                textAlign: "center",
                fontSize: "theme-lg",
                color: "theme-surface",
              }
            ),
            createPrimaryButton("Get started", { align: "center" }),
          ],
        },
      },
    ],
  }),
};

/** Hero with inline image on the left (Hero block) */
const heroImageLeft: SectionPreset = {
  id: "hero-image-left",
  category: "hero",
  title: "هيرو بصورة يسار",
  previewImage: PLACEHOLDER_IMAGE,
  componentData: createSection({
    name: "Hero split",
    paddingTop: "0px",
    paddingBottom: "0px",
    paddingHorizontal: "0px",
    maxWidth: "100%",
    content: [
      createHeroBlock({
        title: "Your headline here",
        description:
          "<p>Supporting description that explains your offer and guides shoppers to take action.</p>",
        align: "left",
        padding: "120px",
        buttons: [createHeroButton("Shop now", "#", "primary")],
        image: {
          url: "https://placehold.co/800x500/e2e8f0/64748b?text=Image",
          mode: "inline",
          content: [],
        },
      }),
    ],
  }),
};

export const HERO_PRESETS: SectionPreset[] = [
  heroBgImage,
  heroBgVideo,
  heroImageLeft,
];
