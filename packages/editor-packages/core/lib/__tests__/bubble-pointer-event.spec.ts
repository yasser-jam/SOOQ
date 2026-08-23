import {
  BubbledPointerEvent,
  isBubbledPointerEvent,
} from "../bubble-pointer-event";

/**
 * Regression coverage for the "blocks inside a section won't drop in a
 * production build" bug.
 *
 * `NestedDroppablePlugin.handleMove` decides which document a pointer event's
 * coordinates belong to. Events bubbled out of the preview iframe carry the
 * real in-iframe element on `originalTarget`; plain host events don't. The
 * check used to be `event instanceof BubbledPointerEvent`, which compares
 * class identity — and `apps/web` pulls the editor in through
 * `transpilePackages`, so a production bundle could hold two copies of this
 * module. The copy that constructed the event (Preview) and the copy that
 * tested it (the plugin) were then different class objects, `instanceof`
 * returned false, and iframe-local coordinates got hit-tested against the
 * host document. Every nested zone missed, `findDeepestCandidate` fell back
 * to the root zone, and only top-level Sections stayed droppable.
 *
 * Dev builds kept a single module copy, so this only ever showed up after
 * `next build` — hence the brand check instead of `instanceof`.
 */

const eventInit = () =>
  ({
    bubbles: true,
    cancelable: false,
    clientX: 10,
    clientY: 20,
    originalTarget: null,
  }) as any;

describe("isBubbledPointerEvent", () => {
  it("recognises an event built by this module", () => {
    const event = new BubbledPointerEvent("pointermove", eventInit());

    expect(isBubbledPointerEvent(event)).toBe(true);
    expect(event instanceof BubbledPointerEvent).toBe(true);
  });

  it("recognises an event from a duplicated copy of the class, where instanceof fails", () => {
    // Stand in for a second bundler chunk holding its own copy of the module.
    const BaseEvent =
      typeof PointerEvent !== "undefined" ? PointerEvent : Event;

    class DuplicatedBubbledPointerEvent extends BaseEvent {
      readonly isPuckBubbledPointerEvent = true;
      originalTarget: EventTarget | null = null;
    }

    const event = new DuplicatedBubbledPointerEvent(
      "pointermove",
      eventInit()
    );

    // The exact failure mode this brand exists to survive.
    expect(event instanceof BubbledPointerEvent).toBe(false);
    expect(isBubbledPointerEvent(event as any)).toBe(true);
  });

  it("does not claim a plain host pointer event", () => {
    const BaseEvent =
      typeof PointerEvent !== "undefined" ? PointerEvent : Event;
    const event = new BaseEvent("pointermove", eventInit());

    expect(isBubbledPointerEvent(event)).toBe(false);
  });
});
