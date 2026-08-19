import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AddSectionModal } from "..";
import { appStoreContext, createAppStore, defaultAppState } from "@/core/store";
import { walkAppState } from "@/core/lib/data/walk-app-state";
import { ROOT_ZONE_HEADER, ROOT_ZONE_FOOTER } from "../../../../shell-zones";
import config from "../../../../index";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as any).ResizeObserver = ResizeObserverStub;

// jsdom doesn't implement PointerEvent; Radix's Tabs/Dialog triggers rely on
// it to decide their click/activation strategy, so without a stand-in they
// silently no-op in tests. See https://github.com/radix-ui/primitives/issues/1822
if (!("PointerEvent" in window)) {
  class PointerEventStub extends MouseEvent {
    pointerId = 1;
    pointerType = "mouse";
  }
  (window as any).PointerEvent = PointerEventStub;
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// flush queued microtasks (dispatchPayload awaits resolveAndReplaceData)
const flush = () => act(async () => {});

// Radix's Tabs.Trigger activates on pointerdown, not on the synthetic click
// alone — replay the sequence a real click produces.
function clickTab(element: HTMLElement) {
  fireEvent.pointerDown(element, { button: 0 });
  fireEvent.mouseDown(element);
  fireEvent.pointerUp(element, { button: 0 });
  fireEvent.mouseUp(element);
  fireEvent.click(element);
}

function renderModal(onClose = jest.fn()) {
  const appStore = createAppStore({
    config,
    state: walkAppState(defaultAppState, config),
  });

  render(
    <appStoreContext.Provider value={appStore}>
      <AddSectionModal open onClose={onClose} />
    </appStoreContext.Provider>
  );

  return { appStore, onClose };
}

describe("AddSectionModal", () => {
  it("shows the three tabs and switches between them", () => {
    renderModal();

    expect(screen.getByRole("tab", { name: "تخطيط" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "العناصر الأساسية" })
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "المتجر" })).toBeInTheDocument();

    // Layout tab is active by default — a layout-only preset is visible…
    expect(screen.getByText("تخطيط ثلاث أعمدة")).toBeInTheDocument();
    // …and a commerce-only preset is not yet in the DOM.
    expect(screen.queryByText("سلة التسوق")).not.toBeInTheDocument();

    clickTab(screen.getByRole("tab", { name: "المتجر" }));

    expect(screen.getByText("سلة التسوق")).toBeInTheDocument();
    expect(screen.queryByText("تخطيط ثلاث أعمدة")).not.toBeInTheDocument();
  });

  it("inserts a section preset into the page content and closes", async () => {
    const { appStore, onClose } = renderModal();

    fireEvent.click(screen.getByText("تخطيط ثلاث أعمدة"));
    await flush();

    const content = appStore.getState().state.data.content;
    expect(content).toHaveLength(1);
    expect(content[0]?.type).toBe("Section");
    expect((content[0]?.props as { columns?: number }).columns).toBe(3);
    expect(onClose).toHaveBeenCalled();
  });

  it("applies a header preset to the site-wide header zone, not page content", async () => {
    const { appStore, onClose } = renderModal();

    clickTab(screen.getByRole("tab", { name: "العناصر الأساسية" }));
    fireEvent.click(screen.getByText("شعار يمين — روابط يسار"));
    await flush();

    const { state } = appStore.getState();
    expect(state.data.zones?.[ROOT_ZONE_HEADER]).toHaveLength(1);
    expect(state.data.content).toHaveLength(0);
    expect(state.ui.plugin?.current).toBe("zones");
    expect(onClose).toHaveBeenCalled();
  });

  it("applies a footer preset to the site-wide footer zone", async () => {
    const { appStore } = renderModal();

    clickTab(screen.getByRole("tab", { name: "العناصر الأساسية" }));
    fireEvent.click(screen.getByText("تذييل تجاري — أعمدة كاملة"));
    await flush();

    const { state } = appStore.getState();
    expect(state.data.zones?.[ROOT_ZONE_FOOTER]).toHaveLength(1);
  });

  it("search finds cards across tabs, ignoring the active category", () => {
    renderModal();

    // Still on the default "layout" tab — footer preset isn't visible yet.
    expect(
      screen.queryByText("تذييل تجاري — أعمدة كاملة")
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("ابحث في الأقسام…"), {
      target: { value: "تذييل" },
    });

    expect(screen.getByText("تذييل تجاري — أعمدة كاملة")).toBeInTheDocument();
    // Tabs are hidden while a search query is active.
    expect(screen.queryByRole("tab", { name: "تخطيط" })).not.toBeInTheDocument();
  });
});
