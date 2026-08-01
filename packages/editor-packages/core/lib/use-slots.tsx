import { ReactNode, useMemo, useRef } from "react";
import { ComponentData, Config, Content, RootData } from "../types";
import { DropZoneProps } from "../components/DropZone/types";
import { useFieldTransforms } from "./field-transforms/use-field-transforms";
import { getSlotTransform } from "./field-transforms/default-transforms/slot-transform";

type SlotRenderer = (
  dzProps: DropZoneProps & { content: Content }
) => ReactNode;

/**
 * Slot field → React component transform for Puck items.
 *
 * Critical: `getSlotTransform` builds a *new* Slot component type each time it
 * runs. If we recreate transforms on every parent render (e.g. StoreContext
 * updates while typing on /settings), nested slots remount — Leaflet maps
 * reinitalize and inputs lose focus. Keep the transform identity stable and
 * only re-map when `item` / config actually change.
 */
export function useSlots<
  T extends ComponentData | RootData,
  UserConfig extends Config
>(
  config: UserConfig,
  item: T,
  renderSlotEdit: SlotRenderer,
  renderSlotRender: SlotRenderer = renderSlotEdit,
  readOnly?: T["readOnly"],
  forceReadOnly?: boolean
): T["props"] {
  const editRef = useRef(renderSlotEdit);
  const renderRef = useRef(renderSlotRender);
  editRef.current = renderSlotEdit;
  renderRef.current = renderSlotRender;

  const transforms = useMemo(
    () =>
      getSlotTransform(
        (dzProps) => editRef.current(dzProps),
        (dzProps) => renderRef.current(dzProps)
      ),
    []
  );

  return useFieldTransforms(
    config,
    item as ComponentData,
    transforms,
    readOnly,
    forceReadOnly
  );
}
