"use client";

import React, { createContext, useContext } from "react";
import type { BoundDataContextValue } from "./types";

const defaultValue: BoundDataContextValue = {
  data: null,
  isLoading: false,
  isError: false,
  metadata: null,
  language: "ar",
  selectedVariantId: null,
  setSelectedVariantId: () => {},
};

export const BoundDataContext = createContext<BoundDataContextValue>(defaultValue);

export function BoundDataProvider({
  value,
  children,
}: {
  value: BoundDataContextValue;
  children: React.ReactNode;
}) {
  return (
    <BoundDataContext.Provider value={value}>{children}</BoundDataContext.Provider>
  );
}

export function useBoundData(): BoundDataContextValue {
  return useContext(BoundDataContext);
}
