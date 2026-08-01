"use client";

import React from "react";
import { useStoreAuth } from "../store-context";
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
 *
 * Subscribes to auth only — not the full StoreContext — so typing into
 * account/address drafts does not re-render every gated block on the page.
 */
export function ShowConditionGate({
  condition,
  isEditing = false,
  children,
}: ShowConditionGateProps) {
  const auth = useStoreAuth();

  if (!shouldShowForCondition(condition, auth.isLoggedIn, isEditing)) {
    return null;
  }

  return <>{children}</>;
}
