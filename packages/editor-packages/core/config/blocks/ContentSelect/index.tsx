"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import {
  isBoundSelectAction,
  SELECT_ACTION_OPTIONS,
  type SelectAction,
} from "../../content/select-actions";
import { ENUM_MAPS } from "../../content/enum-labels";
import { useBoundData } from "../../binding";
import { useSampleDataInEditor } from "../../data-adapter";
import { useStore, type CustomerAddress } from "../../store-context";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";
import styles from "../ContentInput/styles.module.css";

const getClassName = getClassNameFactory("ContentInput", styles);

export type SelectOption = { value: string; label: string };

/** "العمل — دمشق، شارع الحمرا" — one line the customer can pick from. */
export function formatAddressOption(address: CustomerAddress): string {
  const place = [address.governorate, address.city, address.streetAddress]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join("، ");
  const label = address.label?.trim();
  return label && place ? `${label} — ${place}` : label || place || "عنوان";
}

/**
 * Editor-only rows so the merchant sees a populated control on the canvas. Also used by
 * `ContentDropdown`, which merges this block's system actions in (see `dropdown-actions.ts`).
 */
export const SAMPLE_ADDRESS_OPTIONS: SelectOption[] = [
  { value: "sample-address-1", label: "المنزل — دمشق، شارع الحمرا" },
  { value: "sample-address-2", label: "العمل — دمشق، أبو رمانة" },
];

export const SAMPLE_PAYMENT_OPTIONS: SelectOption[] = [
  { value: "COD", label: "الدفع عند الاستلام" },
];

export type ContentSelectProps = WithLayout<{
  label: BilingualString | string;
  name: string;
  selectAction: SelectAction | "";
  enumMapKey?: keyof typeof ENUM_MAPS | "";
}>;

const ContentSelectInner: ComponentConfig<ContentSelectProps> = {
  label: "قائمة اختيار",

  fields: {
    label: bilingualTextField({ label: "التسمية" }),
    name: { type: "text", label: "الاسم (للإرسال)" },
    selectAction: {
      type: "select",
      label: "الإجراء",
      options: [{ label: "بدون", value: "" }, ...SELECT_ACTION_OPTIONS],
    },
  },

  defaultProps: {
    label: { ar: "اختر", en: "Select" },
    name: "select",
    selectAction: "",
    enumMapKey: "",
  },

  render: ({ label, name, selectAction = "", enumMapKey = "", puck }) => {
    const { language } = useActiveLanguage();
    const resolvedLabel = pickLang(label, language);
    const { returnDraft, customer, checkout, actions } = useStore();
    const { data } = useBoundData();
    const sampleInEditor = useSampleDataInEditor();
    const sampleMode = puck.isEditing && sampleInEditor;

    const orderItemId =
      typeof data?.item === "object" &&
      data.item != null &&
      "orderItemId" in data.item
        ? String((data.item as { orderItemId?: string }).orderItemId ?? "")
        : "";

    const options = useMemo<SelectOption[]>(() => {
      if (selectAction === "checkout_address") {
        if (sampleMode) return SAMPLE_ADDRESS_OPTIONS;
        return customer.addresses.map((address) => ({
          value: address.addressId,
          label: formatAddressOption(address),
        }));
      }

      if (selectAction === "checkout_payment_method") {
        if (sampleMode) return SAMPLE_PAYMENT_OPTIONS;
        return checkout.paymentMethods.map((method) => ({
          value: method.providerCode,
          label: method.displayName || method.providerCode,
        }));
      }

      if (enumMapKey && enumMapKey in ENUM_MAPS) {
        return Object.entries(ENUM_MAPS[enumMapKey as keyof typeof ENUM_MAPS]).map(
          ([value, entry]) => ({
            value,
            label: entry.label,
          })
        );
      }
      return [];
    }, [
      selectAction,
      sampleMode,
      customer.addresses,
      checkout.paymentMethods,
      enumMapKey,
    ]);

    const boundValue =
      selectAction === "return_item_condition" && orderItemId
        ? (returnDraft.items[orderItemId]?.condition ?? "OPENED")
        : selectAction === "checkout_address"
          ? (checkout.addressId ?? options[0]?.value ?? "")
          : selectAction === "checkout_payment_method"
            ? (checkout.paymentMethodCode ?? options[0]?.value ?? "")
            : (options[0]?.value ?? "");

    const [localValue, setLocalValue] = useState(boundValue);

    useEffect(() => {
      setLocalValue(boundValue);
    }, [boundValue]);

    const handleChange = (next: string) => {
      setLocalValue(next);
      if (puck.isEditing) return;

      if (selectAction === "checkout_address") {
        actions.checkout.selectAddress(next);
        return;
      }

      if (selectAction === "checkout_payment_method") {
        actions.checkout.selectPaymentMethod(next);
        return;
      }

      if (selectAction === "return_item_condition" && orderItemId) {
        actions.orders.setReturnItemCondition(orderItemId, next);
      }
    };

    // A bound select with nothing to pick from is a dead control — the empty
    // state (no saved address yet) is handled by a sibling block instead.
    if (isBoundSelectAction(selectAction) && options.length === 0) {
      return <></>;
    }

    return (
      <div className={getClassName()}>
        {resolvedLabel.trim() ? (
          <label className={getClassName("label")} htmlFor={`cs-${name}`}>
            {resolvedLabel}
          </label>
        ) : null}
        <select
          id={`cs-${name}`}
          className={getClassName("input")}
          name={name}
          value={localValue}
          disabled={puck.isEditing}
          onChange={(event) => handleChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
};

export const ContentSelect = withLayout(ContentSelectInner);
