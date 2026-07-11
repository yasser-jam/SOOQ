/* Browser APIs missing from jsdom that editor modules touch at import time. */
import { ResizeObserver } from "@juggle/resize-observer";

const globalAny = globalThis as any;

globalAny.ResizeObserver = globalAny.ResizeObserver ?? ResizeObserver;

globalAny.IntersectionObserver =
  globalAny.IntersectionObserver ??
  class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as any;
}
