import type { DragDropManager } from "@dnd-kit/dom";
import { getFrame } from "../get-frame";

/**
 * dnd-kit 0.1.18 finishes a drop through a single un-guarded promise chain in
 * its Feedback plugin:
 *
 *   animateTransform(...).then(() => { animation?.finish(); onComplete(); })
 *
 * There is no `.catch`, no timeout, and `onComplete` is the *only* thing that
 * sets `source.status = "idle"`. If that promise rejects (the WAAPI animation
 * is cancelled because the element is detached mid-drop) or throws
 * (`Animation.finish()` raises InvalidStateError on an infinite/unresolved
 * animation), the source is stranded at `"dropping"` forever. Then:
 *
 *   - `DragOperationManager.stop()` never reaches `dragOperation.reset()`, so
 *     `status` stays `"dropped"` — which counts as `initialized`.
 *   - The `Cursor` plugin keeps its `* { cursor: grabbing !important }` style
 *     sheet in the document head, so the cursor is stuck in the closed-hand
 *     state everywhere.
 *   - `actions.start()` throws "Cannot start a drag operation while another is
 *     active", so every later drag is dead.
 *   - `stop()` early-returns on the aborted controller, so nothing — Escape,
 *     blur, clicking — can ever recover it.
 *   - Puck's own `onDragEnd` waits on the same `source.status === "idle"`
 *     signal, so the dropped block is never inserted/moved and
 *     `state.ui.isDragging` stays `true`.
 *
 * The only exit is a page reload. This module is the escape hatch: it reverses
 * the parts of the Feedback plugin's `cleanup()` that matter and forces the
 * operation back to idle so the editor keeps working.
 */

/** Attributes the Feedback plugin puts on the live (floating) element. */
const DRAGGING_ATTRIBUTE = "data-dnd-dragging";
const DROPPING_ATTRIBUTE = "data-dnd-dropping";
/** Attribute on the throwaway clone left behind in the layout flow. */
const PLACEHOLDER_ATTRIBUTE = "data-dnd-placeholder";

/** Custom properties the Feedback plugin writes onto the floating element. */
const FEEDBACK_CSS_VARS = [
  "--dnd-top",
  "--dnd-left",
  "--dnd-width",
  "--dnd-height",
  "--dnd-transition",
];

const documentsToClean = (): Document[] => {
  if (typeof document === "undefined") return [];

  const docs = new Set<Document>([document]);

  const frame = getFrame();

  if (frame && "head" in frame) {
    docs.add(frame as Document);
  }

  return [...docs];
};

/**
 * Undo the DOM side effects of an interrupted drop: put the floating element
 * back where its placeholder is sitting, drop the placeholder, and strip the
 * fixed-position styling that keeps the element glued to the cursor.
 */
const restoreFeedbackElements = (doc: Document) => {
  doc
    .querySelectorAll<HTMLElement>(`[${DRAGGING_ATTRIBUTE}]`)
    .forEach((element) => {
      element.removeAttribute(DRAGGING_ATTRIBUTE);
      element.removeAttribute(DROPPING_ATTRIBUTE);

      // The element is promoted to the top layer during a drag; leaving it
      // there would keep it floating above the canvas.
      if (element.hasAttribute("popover")) {
        try {
          element.hidePopover?.();
        } catch {
          // hidePopover throws if the popover was never shown — harmless.
        }
        element.removeAttribute("popover");
      }

      FEEDBACK_CSS_VARS.forEach((property) =>
        element.style.removeProperty(property)
      );
    });

  doc
    .querySelectorAll<HTMLElement>(`[${PLACEHOLDER_ATTRIBUTE}]`)
    .forEach((placeholder) => {
      // The placeholder is a detached clone standing in for the real element.
      // Nothing references it once the drag is over.
      placeholder.remove();
    });
};

/**
 * Force a wedged drag operation back to idle.
 *
 * @returns `true` if the operation was stuck and had to be forced, `false` if
 *   it had already settled on its own (the normal path).
 */
export const recoverDragOperation = (manager: DragDropManager): boolean => {
  const operation = manager.dragOperation;

  if (operation.status.idle) return false;

  const source = operation.source;

  // Setting the source idle is the signal `DragOperationManager.stop()` is
  // still waiting on; doing it here lets dnd-kit run its own cleanup path.
  try {
    if (source && source.status !== "idle") {
      source.status = "idle";
    }
  } catch {
    // The draggable may already be destroyed; the hard reset below covers it.
  }

  // `stop()`'s waiter only runs if its controller is still the live one. When
  // it isn't, reset the operation directly so `status.initialized` flips false
  // and the Cursor plugin removes its `cursor: grabbing` stylesheet.
  if (!operation.status.idle) {
    operation.controller = undefined;
    operation.reset();
  }

  documentsToClean().forEach(restoreFeedbackElements);

  return true;
};
