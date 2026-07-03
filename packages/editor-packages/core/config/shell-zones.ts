/** Legacy shell rail zones (SiteDrawerShell v1 placement). */
export const SHELL_LEFT_ZONE = "shell-left-zone";
export const SHELL_RIGHT_ZONE = "shell-right-zone";

export const ROOT_SHELL_LEFT_ZONE = `root:${SHELL_LEFT_ZONE}`;
export const ROOT_SHELL_RIGHT_ZONE = `root:${SHELL_RIGHT_ZONE}`;

/** Site-wide zone keys stored in SiteData.zones / Puck root DropZones.
 *  Must not contain ":" — Puck indexes zones as `${parentId}:${zone}` via split(":"). */
export const ZONE_HEADER = "zone-header";
export const ZONE_FOOTER = "zone-footer";
export const ZONE_DRAWER = "zone-drawer";
export const ZONE_POPUP = "zone-popup";
export const ZONE_BOTTOM_SHEET = "zone-bottom-sheet";

export const ROOT_ZONE_HEADER = `root:${ZONE_HEADER}`;
export const ROOT_ZONE_FOOTER = `root:${ZONE_FOOTER}`;
export const ROOT_ZONE_DRAWER = `root:${ZONE_DRAWER}`;
export const ROOT_ZONE_POPUP = `root:${ZONE_POPUP}`;
export const ROOT_ZONE_BOTTOM_SHEET = `root:${ZONE_BOTTOM_SHEET}`;

export const SITE_ZONE_KEYS = [
  ZONE_HEADER,
  ZONE_FOOTER,
  ZONE_DRAWER,
  ZONE_POPUP,
  ZONE_BOTTOM_SHEET,
] as const;

export type SiteZoneKey = (typeof SITE_ZONE_KEYS)[number];

export const ROOT_SITE_ZONE_KEYS = [
  ROOT_ZONE_HEADER,
  ROOT_ZONE_FOOTER,
  ROOT_ZONE_DRAWER,
  ROOT_ZONE_POPUP,
  ROOT_ZONE_BOTTOM_SHEET,
] as const;
