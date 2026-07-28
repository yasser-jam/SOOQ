"use client";

import React from "react";
import { useStore } from "../store-context";
import {
  shouldShowForCondition,
  type ShowCondition,
} from "../lib/show-condition";

type ShowConditionGateProps = {
  condition?: ShowCondition | string | null;
  isEditing?: boolean;
  children: React.ReactNode;
};

/**
 * Hides children on the storefront when `showCondition` does not match
 * the customer session. Always renders in the editor so blocks stay selectable.
 */
export function ShowConditionGate({
  condition,
  isEditing = false,
  children,
}: ShowConditionGateProps) {
  const { auth } = useStore();

  if (!shouldShowForCondition(condition, auth.isLoggedIn, isEditing)) {
    return null;
  }

  return <>{children}</>;
}
