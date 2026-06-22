import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore } from "../store";
import { PuckAction } from "../reducer";

/**
 * Custom hook for managing sidebar resize functionality
 * @param position The position of the sidebar ("left" or "right")
 * @param dispatch The dispatch function from the app store
 * @returns Object containing width, setWidth, sidebarRef, and handleResizeEnd
 */
export function useSidebarResize(
  position: "left" | "right",
  dispatch: (action: PuckAction) => void
) {
  const clampWidth = useCallback((candidate: number) => {
    const min = 140;

    if (typeof window === "undefined") {
      return Math.max(min, Math.min(400, Math.round(candidate)));
    }

    const max = Math.max(min, Math.min(window.innerWidth - 180, 400));
    return Math.max(min, Math.min(max, Math.round(candidate)));
  }, []);

  const [width, setWidth] = useState<number | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const storeWidth = useAppStore((s) =>
    position === "left"
      ? s.state.ui.leftSideBarWidth
      : s.state.ui.rightSideBarWidth
  );

  // Load saved widths from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined" && storeWidth == null) {
      try {
        const savedWidths = localStorage.getItem("puck-sidebar-widths");
        if (savedWidths) {
          const widths = JSON.parse(savedWidths);
          const savedWidth = widths[position];
          const key =
            position === "left" ? "leftSideBarWidth" : "rightSideBarWidth";

          if (typeof savedWidth === "number" && Number.isFinite(savedWidth)) {
            dispatch({
              type: "setUi",
              ui: {
                [key]: clampWidth(savedWidth),
              },
            });
          }
        }
      } catch (error) {
        console.error(
          `Failed to load ${position} sidebar width from localStorage`,
          error
        );
      }
    }
  }, [dispatch, position, storeWidth, clampWidth]);

  useEffect(() => {
    if (typeof storeWidth === "number" && Number.isFinite(storeWidth)) {
      setWidth(clampWidth(storeWidth));
      return;
    }

    setWidth(null);
  }, [storeWidth, clampWidth]);

  const handleResizeEnd = useCallback(
    (width: number) => {
      const nextWidth = clampWidth(width);

      // Update store
      dispatch({
        type: "setUi",
        ui: {
          [position === "left" ? "leftSideBarWidth" : "rightSideBarWidth"]:
            nextWidth,
        },
      });

      // Save to localStorage
      let widths = {};
      if (typeof window !== "undefined") {
        try {
          const savedWidths = localStorage.getItem("puck-sidebar-widths");
          widths = savedWidths ? JSON.parse(savedWidths) : {};
        } catch {
          widths = {};
        } finally {
          localStorage.setItem(
            "puck-sidebar-widths",
            JSON.stringify({
              ...widths,
              [position]: nextWidth,
            })
          );
        }
      }

      // Trigger auto zoom
      window.dispatchEvent(
        new CustomEvent("viewportchange", {
          bubbles: true,
          cancelable: false,
        })
      );
    },
    [dispatch, position, clampWidth]
  );

  return {
    width,
    setWidth,
    sidebarRef,
    handleResizeEnd,
  };
}
