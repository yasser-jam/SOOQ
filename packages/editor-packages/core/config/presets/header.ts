import type { ZonePreset } from "./types";
import {
  HEADER_LAYOUT_OPTIONS,
  getDefaultHeaderLayoutOption,
  headerLayoutOptionToPreset,
} from "./header-layouts";

export {
  HEADER_LAYOUT_DEFINITIONS,
  HEADER_LAYOUT_OPTIONS,
  buildHeaderZoneSection,
  headerLayoutOptionToPreset,
  getDefaultHeaderLayoutOption,
  type HeaderLayoutId,
  type HeaderLayoutOption,
} from "./header-layouts";

export const ZONE_HEADER_PRESETS: ZonePreset[] = HEADER_LAYOUT_OPTIONS.map(
  headerLayoutOptionToPreset
);

export const DEFAULT_ZONE_HEADER_PRESET = headerLayoutOptionToPreset(
  getDefaultHeaderLayoutOption()
);

/** @deprecated Use ZONE_HEADER_PRESETS */
export const HEADER_PRESETS = ZONE_HEADER_PRESETS;
