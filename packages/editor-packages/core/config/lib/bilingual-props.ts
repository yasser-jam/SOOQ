/**
 * Registry of props that store BilingualString ({ ar, en }) values.
 *
 * Consumed by: normalize-editor-data migration, theme codemod, registry-consistency tests.
 * No block imports here — plain data to avoid cycles.
 */

export type BilingualPropDef = {
  path: string;
  /** Sibling *Ar prop to collapse during migration (base prop holds English). */
  collapseFrom?: string;
};

export const BILINGUAL_PROPS: Record<string, BilingualPropDef[]> = {
  ContentHeading: [{ path: "text" }],
  ContentParagraph: [{ path: "text" }],
  ContentButton: [{ path: "label" }],
  ContentLink: [{ path: "title" }],
  ContentInput: [{ path: "label" }, { path: "placeholder" }],
  ContentSwitch: [{ path: "label" }, { path: "helperText" }],
  ContentImage: [{ path: "alt" }],

  ButtonGroup: [{ path: "allButtonTitle" }, { path: "items[].title" }],
  Accordion: [
    { path: "heading" },
    { path: "description" },
    { path: "items[].title" },
    { path: "items[].body" },
  ],
  Testimonials: [
    { path: "inlineItems[].name", collapseFrom: "inlineItems[].nameAr" },
    { path: "inlineItems[].role", collapseFrom: "inlineItems[].roleAr" },
    { path: "inlineItems[].text", collapseFrom: "inlineItems[].textAr" },
  ],
  ImageGallery: [{ path: "images[].alt" }],

  NavMenu: [{ path: "items[].label" }],
  Sidebar: [{ path: "title" }],
  SideDrawer: [
    { path: "title" },
    { path: "triggerLabel" },
    { path: "links[].label" },
  ],
  ContactForm: [
    { path: "title" },
    { path: "subtitle" },
    { path: "submitLabel" },
    { path: "successMessage" },
  ],

  SiteHeader: [
    { path: "title" },
    { path: "links[].label", collapseFrom: "links[].labelAr" },
  ],
  SiteFooter: [
    { path: "title" },
    { path: "tagline", collapseFrom: "taglineAr" },
    { path: "bottomBarText", collapseFrom: "bottomBarTextAr" },
    { path: "columns[].title", collapseFrom: "columns[].titleAr" },
    {
      path: "columns[].links[].label",
      collapseFrom: "columns[].links[].labelAr",
    },
    { path: "bottomLinks[].label", collapseFrom: "bottomLinks[].labelAr" },
  ],
  SiteDrawerShell: [
    { path: "triggerLabel", collapseFrom: "triggerLabelAr" },
    { path: "title", collapseFrom: "titleAr" },
    { path: "links[].label", collapseFrom: "links[].labelAr" },
  ],

  root: [
    { path: "title" },
    { path: "headerBrandTitle" },
    { path: "headerLinks[].label", collapseFrom: "headerLinks[].labelAr" },
    { path: "footerBrandTitle" },
    { path: "footerTagline", collapseFrom: "footerTaglineAr" },
    { path: "footerColumns[].title", collapseFrom: "footerColumns[].titleAr" },
    {
      path: "footerColumns[].links[].label",
      collapseFrom: "footerColumns[].links[].labelAr",
    },
    { path: "drawerTriggerLabel", collapseFrom: "drawerTriggerLabelAr" },
    { path: "drawerTitle", collapseFrom: "drawerTitleAr" },
    { path: "drawerLinks[].label", collapseFrom: "drawerLinks[].labelAr" },
  ],
};

/** All distinct prop paths for a block type (flat list). */
export function getBilingualPaths(blockType: string): string[] {
  return (BILINGUAL_PROPS[blockType] ?? []).map((def) => def.path);
}
