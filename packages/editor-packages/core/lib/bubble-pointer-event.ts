export interface BubbledPointerEventType extends PointerEvent {
  originalTarget: EventTarget | null;
}

// Necessary to enable server build
const BaseEvent = typeof PointerEvent !== "undefined" ? PointerEvent : Event;

export class BubbledPointerEvent extends BaseEvent {
  _originalTarget: EventTarget | null = null;

  /**
   * Brand used by `isBubbledPointerEvent`. `instanceof` would be the obvious
   * test, but it compares class identity, and this module can be duplicated
   * across bundler chunks — `apps/web` pulls the editor through
   * `transpilePackages`, and in a production build the copy that constructs
   * the event (Preview) and the copy that tests it (NestedDroppablePlugin)
   * were different class objects. `instanceof` then returned false, the
   * plugin ignored `originalTarget`, and iframe-local pointer coordinates got
   * hit-tested against the host document — so nested drop zones never
   * resolved and only the root zone stayed droppable.
   */
  readonly isPuckBubbledPointerEvent = true;

  constructor(
    type: string,
    data: PointerEvent & { originalTarget: EventTarget | null }
  ) {
    super(type, data);
    this.originalTarget = data.originalTarget;
  }

  // Necessary for Firefox
  set originalTarget(target: EventTarget | null) {
    this._originalTarget = target;
  }

  // Necessary for Firefox
  get originalTarget() {
    return this._originalTarget;
  }
}

/** Bundler-safe replacement for `event instanceof BubbledPointerEvent`. */
export const isBubbledPointerEvent = (
  event: Event
): event is BubbledPointerEventType =>
  (event as Partial<BubbledPointerEvent>).isPuckBubbledPointerEvent === true;
