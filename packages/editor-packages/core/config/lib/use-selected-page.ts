"use client";

import { useSyncExternalStore } from "react";

import {
  getSelectedPageOrDefault,
  SELECTED_PAGE_EVENT,
} from "./selected-page";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(SELECTED_PAGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(SELECTED_PAGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getSnapshot() {
  return getSelectedPageOrDefault();
}

function getServerSnapshot() {
  return "/";
}

export function useSelectedPage() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
