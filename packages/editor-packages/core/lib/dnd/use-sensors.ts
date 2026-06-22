import { useState } from "react";
import { PointerSensor } from "@dnd-kit/react";
import { isElement } from "@dnd-kit/dom/utilities";
import { type Distance } from "@dnd-kit/geometry";
export interface DelayConstraint {
  value: number;
  tolerance: Distance;
}

export interface DistanceConstraint {
  value: Distance;
  tolerance?: Distance;
}

export interface ActivationConstraints {
  distance?: DistanceConstraint;
  delay?: DelayConstraint;
}

const touchDefault = { delay: { value: 200, tolerance: 10 } };
// Mouse/pen grabs already use a 5px distance gate to distinguish click from
// drag. A 200ms delay on top of that made block drags feel sluggish — the
// merchant expected instant grab and waited for the system cursor to change.
// Reducing the delay to 80ms keeps brief clicks from latching onto a drag
// while making intentional drags feel immediate. Distance is bumped to 6px
// for the same reason: it absorbs a bit more cursor jitter without losing
// snap.
const otherDefault = {
  delay: { value: 80, tolerance: 10 },
  distance: { value: 6 },
};

type SensorDescriptor = ReturnType<typeof PointerSensor.configure>;

export const useSensors = (
  {
    other = otherDefault,
    mouse,
    touch = touchDefault,
  }: {
    mouse?: ActivationConstraints;
    touch?: ActivationConstraints;
    other?: ActivationConstraints;
  } = {
    touch: touchDefault,
    other: otherDefault,
  }
): SensorDescriptor[] => {
  const [sensors] = useState(() => [
    PointerSensor.configure({
      activationConstraints(event, source) {
        const { pointerType, target } = event;

        if (
          pointerType === "mouse" &&
          isElement(target) &&
          (source.handle === target || source.handle?.contains(target))
        ) {
          return mouse;
        }

        if (pointerType === "touch") {
          return touch;
        }

        return other;
      },
    }),
  ]);

  return sensors;
};
