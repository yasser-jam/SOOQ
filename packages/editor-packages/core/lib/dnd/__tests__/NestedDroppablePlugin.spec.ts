import { findDeepestCandidate } from "../NestedDroppablePlugin";
import { GlobalPosition } from "../../global-position";
import { rootAreaId, rootDroppableId } from "../../root-droppable-id";

/**
 * Regression coverage for the "drag escapes a padding-less nested zone near
 * its own edge" bug: `getPointerCollisions` used to shrink a dropzone
 * container's own hit box by BUFFER (6px), the same margin meant only to
 * disambiguate between tightly-packed sibling *components*. Near a nested
 * zone's edge (e.g. swapping the last two items in a zero-padding Group, or
 * any tight layout at a narrow/mobile viewport width) that shrunk box
 * excluded the container itself, so the deepest candidate fell back to an
 * ancestor zone — the dragged item appeared to leave the group it started in.
 */

const mockRect = (
  el: Element,
  rect: { left: number; right: number; top: number; bottom: number }
) => {
  jest.spyOn(el, "getBoundingClientRect").mockReturnValue({
    ...rect,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON() {
      return rect;
    },
  } as DOMRect);
};

const buildManager = (
  droppables: Record<string, { type: string; data: Record<string, unknown> }>
) =>
  ({
    registry: {
      droppables: {
        get: (id: string) =>
          droppables[id] ? { id, ...droppables[id] } : undefined,
      },
    },
    dragOperation: { source: undefined },
  }) as any;

describe("findDeepestCandidate", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.restoreAllMocks();
  });

  it("keeps a nested dropzone as the deepest candidate 2px from its own (padding-less) edge, instead of escaping to the ancestor zone", () => {
    document.body.innerHTML = `
      <div id="section" data-puck-dropzone="root"></div>
      <div id="group" data-puck-dropzone="group1:content"></div>
    `;
    const sectionEl = document.getElementById("section")!;
    const groupEl = document.getElementById("group")!;

    // Group spans x:[0,100] inside a much larger section. The pointer sits
    // 2px from the group's right edge — inside the 6px buffer's exclusion
    // zone, but still genuinely inside the group.
    mockRect(sectionEl, { left: 0, right: 400, top: 0, bottom: 200 });
    mockRect(groupEl, { left: 0, right: 100, top: 0, bottom: 40 });

    document.elementsFromPoint = jest
      .fn()
      .mockReturnValue([groupEl, sectionEl]);

    const target = document.createElement("div");
    document.body.appendChild(target);
    const position = new GlobalPosition(target, { x: 98, y: 20 });

    const manager = buildManager({
      root: {
        type: "dropzone",
        data: { areaId: "root", depth: 0, path: [], isDroppableTarget: true },
      },
      "group1:content": {
        type: "dropzone",
        data: {
          areaId: "group1",
          depth: 1,
          path: ["group1"],
          isDroppableTarget: true,
        },
      },
    });

    expect(findDeepestCandidate(position, manager)).toEqual({
      zone: "group1:content",
      area: "group1",
    });
  });

  it("still applies the buffer to sibling components, so adjacent items don't flip on sub-pixel jitter", () => {
    document.body.innerHTML = `
      <div id="button" data-puck-dnd="button1"></div>
    `;
    const buttonEl = document.getElementById("button")!;

    // Pointer is 2px from the component's right edge — inside the buffer.
    mockRect(buttonEl, { left: 0, right: 40, top: 0, bottom: 24 });

    document.elementsFromPoint = jest.fn().mockReturnValue([buttonEl]);

    const target = document.createElement("div");
    document.body.appendChild(target);
    const position = new GlobalPosition(target, { x: 38, y: 12 });

    const manager = buildManager({
      button1: {
        type: "component",
        data: {
          areaId: "group1",
          zone: "group1:content",
          index: 0,
          componentType: "Button",
          containsActiveZone: false,
          depth: 2,
          path: ["group1"],
          inDroppableZone: true,
        },
      },
    });

    // No candidate survives the buffer, and there's nothing else under the
    // pointer, so this falls back to the root default.
    expect(findDeepestCandidate(position, manager)).toEqual({
      zone: rootDroppableId,
      area: rootAreaId,
    });
  });
});
