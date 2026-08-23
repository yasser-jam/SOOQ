import { DragDropManager } from "@dnd-kit/dom";
import { Plugin } from "@dnd-kit/abstract";

import type { Droppable } from "@dnd-kit/dom";

import { effects, untracked } from "@dnd-kit/state";
import { throttle } from "../throttle";
import { ComponentDndData } from "../../components/DraggableComponent";
import { DropZoneDndData } from "../../components/DropZone";
import { getFrame } from "../get-frame";
import { GlobalPosition } from "../global-position";
import {
  BubbledPointerEventType,
  isBubbledPointerEvent,
} from "../bubble-pointer-event";
import { rootAreaId, rootDroppableId } from "../root-droppable-id";

type NestedDroppablePluginOptions = {
  onChange: (
    params: {
      area: string | null;
      zone: string | null;
    },
    manager: DragDropManager
  ) => void;
};

const depthSort = (candidates: Droppable[]) => {
  return candidates.sort((a, b) => {
    const aData = a.data as ComponentDndData | DropZoneDndData;
    const bData = b.data as ComponentDndData | DropZoneDndData;

    // Use depth instead of ref, as this is 1) faster and 2) handles cases where a and b share a ref
    if (aData.depth > bData.depth) {
      return 1;
    }

    if (bData.depth > aData.depth) {
      return -1;
    }

    return 0;
  });
};

const getZoneId = (candidate: Droppable | undefined) => {
  let id: string | null = candidate?.id as string;

  if (!candidate) return null;

  if (candidate.type === "component") {
    const data = candidate.data as ComponentDndData;

    if (data.containsActiveZone) {
      id = null;
    } else {
      id = data.zone;
    }
  } else if (candidate.type === "void") {
    return "void";
  }

  return id;
};

const BUFFER = 6;

const getPointerCollisions = (
  position: GlobalPosition,
  manager: DragDropManager
) => {
  const candidates: Droppable[] = [];

  let elements = position.target.ownerDocument.elementsFromPoint(
    position.x,
    position.y
  );

  const previewFrame = elements.find((el) =>
    el.getAttribute("data-puck-preview")
  );

  // Restrict to drawer element if pointer is over drawer. This is necessary if
  // the drawer is over dnd elements.
  const drawer = elements.find((el) => el.getAttribute("data-puck-drawer"));
  if (drawer) {
    elements = [drawer];
  }

  // If cursor is over iframe (but not drawer), and user is in host doc, go into the iframe doc
  // This occurs when dragging in new items
  if (previewFrame) {
    // Perf: Consider moving this outside of this plugin
    const frame = getFrame();

    if (frame) {
      elements = frame.elementsFromPoint(position.frame.x, position.frame.y);
    }
  }

  if (elements) {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      const dropzoneId = element.getAttribute("data-puck-dropzone");
      const id = element.getAttribute("data-puck-dnd");
      const isVoid = element.hasAttribute("data-puck-dnd-void");

      // A dropzone (container) candidate is always included as long as the
      // pointer is literally inside it — no buffer. The buffer below exists
      // only to disambiguate between tightly-packed SIBLING components; if
      // it also shrinks the container's own hit box, a drag near a nested
      // zone's edge (e.g. swapping two adjacent items in a padding-less
      // Group, or any tight layout at narrow/mobile viewport widths) can
      // fall through the shrunk child box with nothing else left to match
      // it, and the deepest candidate resolves to an ancestor zone instead
      // — the drag appears to "escape" the group it started in.
      if (dropzoneId) {
        const droppable = manager.registry.droppables.get(dropzoneId);

        if (droppable) {
          candidates.push(droppable);
        }
      }

      // Only include a component candidate if we're within a threshold of
      // its bounding box, so the collision doesn't flip between two
      // touching/adjacent siblings on every sub-pixel pointer jitter.
      if (id) {
        let withinBuffer = true;

        if (BUFFER && !isVoid) {
          const box = element.getBoundingClientRect();

          const contractedBox = {
            left: box.left + BUFFER,
            right: box.right - BUFFER,
            top: box.top + BUFFER,
            bottom: box.bottom - BUFFER,
          };

          withinBuffer = !(
            position.frame.x < contractedBox.left ||
            position.frame.x > contractedBox.right ||
            position.frame.y > contractedBox.bottom ||
            position.frame.y < contractedBox.top
          );
        }

        if (withinBuffer) {
          const droppable = manager.registry.droppables.get(id);

          if (droppable) {
            candidates.push(droppable);
          }
        }
      }
    }
  }

  return candidates;
};

export const findDeepestCandidate = (
  position: GlobalPosition,
  manager: DragDropManager
) => {
  const candidates = getPointerCollisions(position, manager);

  if (candidates.length > 0) {
    const sortedCandidates = depthSort(candidates);

    const draggable = manager.dragOperation.source;

    const draggedCandidateIndex = sortedCandidates.findIndex(
      (candidate) => candidate.id === draggable?.id
    );

    const draggedCandidateId = draggable?.id;

    let filteredCandidates = [...sortedCandidates];

    if (draggedCandidateId && draggedCandidateIndex > -1) {
      // Removed dragged candidate
      filteredCandidates.splice(draggedCandidateIndex, 1);
    }

    // Remove any descendants
    filteredCandidates = filteredCandidates.filter((candidate) => {
      const candidateData = candidate.data as
        | ComponentDndData
        | DropZoneDndData;

      if (draggedCandidateId && draggedCandidateIndex > -1) {
        if (candidateData.path.indexOf(draggedCandidateId) > -1) {
          return false;
        }
      }

      if (candidate.type === "dropzone") {
        const candidateData = candidate.data as DropZoneDndData;

        // Remove non-droppable zones
        if (!candidateData.isDroppableTarget) {
          return false;
        }

        // Remove if dragged item is area
        if (candidateData.areaId === draggedCandidateId) {
          return false;
        }
      } else if (candidate.type === "component") {
        const candidateData = candidate.data as ComponentDndData;

        // Remove non-droppable zones
        if (!candidateData.inDroppableZone) {
          return false;
        }
      }

      return true;
    });

    filteredCandidates.reverse();

    const primaryCandidate = filteredCandidates[0];

    if (!primaryCandidate) {
      return { zone: null, area: null };
    }

    const primaryCandidateData = primaryCandidate.data as
      | ComponentDndData
      | DropZoneDndData;
    const primaryCandidateIsComponent =
      "containsActiveZone" in primaryCandidateData;
    const zone = getZoneId(primaryCandidate);
    const area =
      primaryCandidateIsComponent && primaryCandidateData.containsActiveZone
        ? filteredCandidates[0].id
        : filteredCandidates[0]?.data.areaId;

    return { zone, area };
  }

  return {
    zone: rootDroppableId,
    area: rootAreaId,
  };
};

export const createNestedDroppablePlugin = (
  { onChange }: NestedDroppablePluginOptions,
  id: string
): any =>
  class NestedDroppablePlugin extends Plugin<DragDropManager, {}> {
    constructor(manager: DragDropManager, options?: {}) {
      super(manager);

      if (typeof window === "undefined") {
        return;
      }

      this.registerEffect(() => {
        const handleMove = (event: BubbledPointerEventType | PointerEvent) => {
          const target = (
            isBubbledPointerEvent(event) // Necessary for Firefox
              ? event.originalTarget || event.target
              : event.target
          ) as HTMLElement;

          const position = new GlobalPosition(target, {
            x: event.clientX,
            y: event.clientY,
          });

          const elements = document.elementsFromPoint(
            position.global.x,
            position.global.y
          );

          const overEl = elements.some((el) => el.id === id);

          if (overEl) {
            onChange(findDeepestCandidate(position, manager), manager);
          }
        };

        const handleMoveThrottled = throttle(handleMove, 50);

        const handlePointerMove = (event: PointerEvent) => {
          handleMoveThrottled(event);
        };

        document.body.addEventListener("pointermove", handlePointerMove, {
          capture: true, // dndkit's PointerSensor prevents propagation during drag
        });

        const cleanup = () => {
          document.body.removeEventListener("pointermove", handlePointerMove, {
            capture: true,
          });
        };

        return cleanup;
      });
    }
  };
