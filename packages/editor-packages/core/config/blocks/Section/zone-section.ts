import {
  SECTION_KIND_ZONE_HEADER,
  type SectionPresetMetadata,
} from "./section-preset-kinds";

export { SECTION_KIND_ZONE_HEADER } from "./section-preset-kinds";

export const ZONE_HEADER_SECTION_METADATA: SectionPresetMetadata = {
  preset: SECTION_KIND_ZONE_HEADER,
};

/** Puck permissions for site zone shell sections (header/footer).
 *  drag/duplicate/delete locked so the zone's root section can't be removed
 *  or moved out; insert stays open so content can be added freely inside. */
export const ZONE_SHELL_SECTION_PERMISSIONS = {
  drag: false,
  duplicate: false,
  delete: false,
  insert: true,
} as const;

type ZoneSectionProps = {
  sectionKind?: string | null;
  metadata?: SectionPresetMetadata | null;
};

export function isZoneHeaderSection(props: ZoneSectionProps): boolean {
  if (props.metadata?.preset === SECTION_KIND_ZONE_HEADER) return true;
  return props.sectionKind === SECTION_KIND_ZONE_HEADER;
}

/** Base Section props for a header zone preset (merged in zone-shell builders). */
export function buildZoneHeaderSectionProps(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    sectionKind: SECTION_KIND_ZONE_HEADER,
    metadata: ZONE_HEADER_SECTION_METADATA,
    ...overrides,
  };
}
