import { recoverDragOperation } from "../recover-drag-operation";

/**
 * Minimal stand-in for dnd-kit's DragOperationManager. Mirrors the parts
 * `recoverDragOperation` touches: a `status` object whose `idle` getter is
 * derived from `value`, a `source` with a mutable `status`, and `reset()`.
 */
const createManager = ({
  status,
  sourceStatus,
}: {
  status: "idle" | "dragging" | "dropped";
  sourceStatus?: "idle" | "dragging" | "dropping";
}) => {
  const operation = {
    status: {
      value: status,
      get idle() {
        return this.value === "idle";
      },
    },
    source: sourceStatus ? { status: sourceStatus } : null,
    controller: {} as unknown,
    reset() {
      this.status.value = "idle";
    },
  };

  return { dragOperation: operation } as any;
};

describe("recoverDragOperation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("leaves a healthy, already-idle operation alone", () => {
    const manager = createManager({ status: "idle", sourceStatus: "idle" });

    expect(recoverDragOperation(manager)).toBe(false);
  });

  it("forces an operation stranded at 'dropped' back to idle", () => {
    // The wedge: dnd-kit's drop animation promise rejected, so the source
    // never left "dropping" and the operation never left "dropped".
    const manager = createManager({
      status: "dropped",
      sourceStatus: "dropping",
    });

    expect(recoverDragOperation(manager)).toBe(true);
    expect(manager.dragOperation.status.idle).toBe(true);
    expect(manager.dragOperation.source.status).toBe("idle");
    expect(manager.dragOperation.controller).toBeUndefined();
  });

  it("recovers even when the draggable was already destroyed", () => {
    const manager = createManager({ status: "dropped" });

    expect(recoverDragOperation(manager)).toBe(true);
    expect(manager.dragOperation.status.idle).toBe(true);
  });

  it("puts the stranded feedback element back in the flow", () => {
    document.body.innerHTML = `
      <div id="zone">
        <div id="placeholder" data-dnd-placeholder></div>
      </div>
      <div id="floating" data-dnd-dragging data-dnd-dropping popover="manual"></div>
    `;

    const floating = document.getElementById("floating")!;
    floating.style.setProperty("--dnd-top", "120px");
    floating.style.setProperty("--dnd-left", "40px");

    recoverDragOperation(
      createManager({ status: "dropped", sourceStatus: "dropping" })
    );

    // The throwaway clone is gone...
    expect(document.querySelector("[data-dnd-placeholder]")).toBeNull();
    // ...and the real element is no longer pinned to the cursor.
    expect(floating.hasAttribute("data-dnd-dragging")).toBe(false);
    expect(floating.hasAttribute("data-dnd-dropping")).toBe(false);
    expect(floating.hasAttribute("popover")).toBe(false);
    expect(floating.style.getPropertyValue("--dnd-top")).toBe("");
    expect(floating.style.getPropertyValue("--dnd-left")).toBe("");
  });
});
