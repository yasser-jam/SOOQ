import type { ComponentData } from "@/core/types";
import { isZoneHeaderSection } from "../config/blocks/Section/zone-section";
import { ROOT_ZONE_HEADER } from "../config/shell-zones";
import { rootDroppableId } from "./root-droppable-id";

export function isHeaderZoneCompound(zoneCompound: string): boolean {
  return zoneCompound === ROOT_ZONE_HEADER;
}

export function isPageContentZone(zoneCompound: string): boolean {
  return zoneCompound === rootDroppableId;
}

export function getSectionPlacementProps(
  item: ComponentData | null | undefined
): { sectionKind?: string | null; metadata?: { preset?: string } | null } | null {
  if (!item || item.type !== "Section") return null;
  return item.props as {
    sectionKind?: string | null;
    metadata?: { preset?: string } | null;
  };
}

/** Whether a Section may be moved or inserted into `destinationZone`. */
export function isSectionPlacementAllowed(
  item: ComponentData | null | undefined,
  destinationZone: string
): boolean {
  const sectionProps = getSectionPlacementProps(item);

  if (!sectionProps) {
    if (isHeaderZoneCompound(destinationZone)) return false;
    return true;
  }

  if (isZoneHeaderSection(sectionProps)) {
    return isHeaderZoneCompound(destinationZone);
  }

  if (isHeaderZoneCompound(destinationZone)) {
    return false;
  }

  return true;
}

/** Whether a Section may leave `sourceZone` for `destinationZone`. */
export function isSectionMoveAllowed(
  item: ComponentData,
  sourceZone: string,
  destinationZone: string
): boolean {
  if (sourceZone === destinationZone) return true;
  return isSectionPlacementAllowed(item, destinationZone);
}
