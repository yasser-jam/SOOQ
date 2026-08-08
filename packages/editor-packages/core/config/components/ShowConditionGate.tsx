"use client";

import React from "react";
import { useBoundData } from "../binding/BoundDataContext";
import { resolveValueContext } from "../binding/resolve-value-context";
import { useStoreAuth } from "../store-context";
import {
  evaluateDataCondition,
  normalizeDataCondition,
  shouldShowForCondition,
  type DataCondition,
  type ShowCondition,
} from "../lib/show-condition";

type ShowConditionGateProps = {
  condition?: ShowCondition | string | null;
  dataCondition?: unknown;
  isEditing?: boolean;
  children: React.ReactNode;
};

type DataConditionGateProps = {
  condition: DataCondition;
  isEditing?: boolean;
  children: React.ReactNode;
};

function DataConditionGate({
  condition,
  isEditing = false,
  children,
}: DataConditionGateProps) {
  const { data } = useBoundData();

  if (isEditing) return <>{children}</>;

  const resolved = resolveValueContext(condition.path, data);
  if (!evaluateDataCondition(condition, resolved)) return null;

  return <>{children}</>;
}

/**
 * Hides children on the storefront when `showCondition` does not match
 * the customer session. Always renders in the editor so blocks stay selectable.
 *
 * Subscribes to auth only — not the full StoreContext — so typing into
 * account/address drafts does not re-render every gated block on the page.
 */
export function ShowConditionGate({
  condition,
  dataCondition,
  isEditing = false,
  children,
}: ShowConditionGateProps) {
  const auth = useStoreAuth();

  if (!shouldShowForCondition(condition, auth.isLoggedIn, isEditing)) {
    return null;
  }

  const normalized = normalizeDataCondition(dataCondition);
  if (!normalized) return <>{children}</>;

  return (
    <DataConditionGate condition={normalized} isEditing={isEditing}>
      {children}
    </DataConditionGate>
  );
}
