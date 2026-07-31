"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { ComponentConfig, Fields } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { SOOQ_INPUT_ATTR } from "../../lib/login-events";
import {
  ADDRESS_DRAFT_FIELD_BY_ACTION,
  INPUT_ACTION_OPTIONS,
  isAddressDraftInputAction,
  isPriceFilterInputAction,
  type InputAction,
} from "../../content/input-actions";
import type { ValueContext } from "../../binding";
import { useBoundValue } from "../../binding";
import { useStore } from "../../store-context";
import styles from "./styles.module.css";

/** Keep draft writes off the hot path so StoreContext doesn't re-render the page per keystroke. */
const CUSTOMER_DRAFT_DEBOUNCE_MS = 250;

const getClassName = getClassNameFactory("ContentInput", styles);

export type ContentInputPrependIcon = "none" | "search";

export type ContentInputProps = WithLayout<{
  label: string;
  name: string;
  inputType: "text" | "number" | "email" | "password" | "tel" | "search";
  placeholder: string;
  required: boolean;
  prependIcon: ContentInputPrependIcon;
  inputAction: InputAction | "";
  debounceMs: number;
  valueContext?: ValueContext | null;
}>;

const PREPEND_ICON_OPTIONS = [
  { label: "بدون", value: "none" },
  { label: "بحث", value: "search" },
];

/** `""` clears the filter; anything unparseable leaves the last value alone. */
function parsePriceInput(raw: string): number | null | undefined {
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

const ContentInputInner: ComponentConfig<ContentInputProps> = {
  label: "حقل إدخال",

  fields: {
    label: { type: "text", label: "التسمية" },
    name: { type: "text", label: "الاسم (للإرسال)" },
    inputType: {
      type: "select",
      label: "النوع",
      options: [
        { label: "نص", value: "text" },
        { label: "رقم", value: "number" },
        { label: "بحث", value: "search" },
        { label: "بريد إلكتروني", value: "email" },
        { label: "كلمة مرور", value: "password" },
        { label: "هاتف", value: "tel" },
      ],
    },
    placeholder: { type: "text", label: "نص توضيحي" },
    required: {
      type: "radio",
      label: "إلزامي",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    prependIcon: {
      type: "select",
      label: "أيقونة البداية",
      options: PREPEND_ICON_OPTIONS,
    },
    inputAction: {
      type: "select",
      label: "الإجراء",
      options: [{ label: "بدون", value: "" }, ...INPUT_ACTION_OPTIONS],
    },
    debounceMs: {
      type: "number",
      label: "تأخير الكتابة (مللي ثانية)",
    },
  },

  defaultProps: {
    label: "حقل",
    name: "field",
    inputType: "text",
    placeholder: "",
    required: false,
    prependIcon: "none",
    inputAction: "",
    debounceMs: 250,
  },

  render: ({
    label,
    name,
    inputType,
    placeholder,
    required,
    prependIcon = "none",
    inputAction = "",
    debounceMs = 250,
    valueContext,
    puck,
  }) => {
    const { productsPage, customer, actions } = useStore();
    const contextBoundValue = useBoundValue(placeholder || "", valueContext);

    const isSearchProducts = inputAction === "search_products";
    const isPriceFilter = isPriceFilterInputAction(inputAction);
    const isProfileFullName = inputAction === "profile_full_name";
    const isAddressDraft = isAddressDraftInputAction(inputAction);
    const isCustomerDraft = isProfileFullName || isAddressDraft;
    const isContextDisplay =
      inputAction === "" && Boolean(valueContext?.path);
    const isDebouncedBound = isSearchProducts || isPriceFilter;
    const isImmediateBound = isCustomerDraft || isContextDisplay;
    const isBound = isDebouncedBound || isImmediateBound;

    const addressDraftField = isAddressDraft
      ? ADDRESS_DRAFT_FIELD_BY_ACTION[inputAction]
      : null;

    const boundValue = isSearchProducts
      ? productsPage.search
      : inputAction === "filter_min_price"
        ? (productsPage.minPrice?.toString() ?? "")
        : inputAction === "filter_max_price"
          ? (productsPage.maxPrice?.toString() ?? "")
          : isProfileFullName
            ? customer.profileDraft.fullName
            : addressDraftField
              ? String(customer.addressDraft[addressDraftField] ?? "")
              : isContextDisplay
                ? contextBoundValue
                : "";

    const [localValue, setLocalValue] = useState(boundValue);
    const isFocusedRef = useRef(false);
    const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flushCustomerDraft = (value: string) => {
      if (isProfileFullName) {
        actions.customer.setProfileDraftField("fullName", value);
        return;
      }
      if (addressDraftField) {
        actions.customer.setAddressDraftField(addressDraftField, value);
      }
    };

    const clearDraftTimer = () => {
      if (draftTimerRef.current != null) {
        clearTimeout(draftTimerRef.current);
        draftTimerRef.current = null;
      }
    };

    useEffect(() => () => clearDraftTimer(), []);

    // Re-sync from the store when it changes underneath us — but never while
    // the user is typing. Immediate draft writes used to update StoreContext
    // on every keystroke, remounting siblings (map, gates) and stealing focus.
    useEffect(() => {
      if (!isBound) return;
      if (isCustomerDraft && isFocusedRef.current) return;
      setLocalValue(boundValue);
    }, [isBound, isCustomerDraft, boundValue]);

    useEffect(() => {
      if (!isDebouncedBound || puck.isEditing) return;
      if (localValue === boundValue) return;

      const timer = setTimeout(() => {
        if (isSearchProducts) {
          actions.searchProducts(localValue);
          return;
        }
        const parsed = parsePriceInput(localValue);
        if (parsed === undefined) return;
        if (inputAction === "filter_min_price") {
          actions.productsPage.setMinPrice(parsed);
        } else {
          actions.productsPage.setMaxPrice(parsed);
        }
      }, debounceMs);

      return () => clearTimeout(timer);
    }, [
      actions,
      boundValue,
      debounceMs,
      inputAction,
      isDebouncedBound,
      isSearchProducts,
      localValue,
      puck.isEditing,
    ]);

    const handleChange = (next: string) => {
      setLocalValue(next);
      if (puck.isEditing || isContextDisplay) return;

      if (!isCustomerDraft) return;

      clearDraftTimer();
      draftTimerRef.current = setTimeout(() => {
        draftTimerRef.current = null;
        flushCustomerDraft(next);
      }, CUSTOMER_DRAFT_DEBOUNCE_MS);
    };

    const handleFocus = () => {
      isFocusedRef.current = true;
    };

    const handleBlur = () => {
      isFocusedRef.current = false;
      if (puck.isEditing || !isCustomerDraft) return;
      clearDraftTimer();
      if (localValue !== boundValue) {
        flushCustomerDraft(localValue);
      }
    };

    const resolvedType = isSearchProducts
      ? "search"
      : isPriceFilter
        ? "number"
        : inputType;
    const showPrepend = prependIcon === "search";
    const inputClassName = showPrepend
      ? `${getClassName("input")} ${getClassName("inputWithIcon")}`
      : getClassName("input");

    const inputElement = (
      <input
        id={`ci-${name}`}
        className={inputClassName}
        type={resolvedType}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={puck.isEditing}
        readOnly={isContextDisplay && !puck.isEditing}
        dir={
          resolvedType === "email" ||
          resolvedType === "tel" ||
          resolvedType === "number"
            ? "ltr"
            : undefined
        }
        min={isPriceFilter ? 0 : undefined}
        inputMode={isPriceFilter ? "numeric" : undefined}
        value={isBound ? localValue : undefined}
        onChange={
          isBound && !isContextDisplay
            ? (event) => handleChange(event.target.value)
            : undefined
        }
        onFocus={isCustomerDraft ? handleFocus : undefined}
        onBlur={isCustomerDraft ? handleBlur : undefined}
        aria-label={!label.trim() ? placeholder || label : undefined}
        {...{ [SOOQ_INPUT_ATTR]: "" }}
      />
    );

    return (
      <div className={getClassName()}>
        {label.trim() ? (
          <label className={getClassName("label")} htmlFor={`ci-${name}`}>
            {label}
            {required && <span className={getClassName("required")}>*</span>}
          </label>
        ) : null}
        {showPrepend ? (
          <div className={getClassName("inputWrap")}>
            <Search
              className={getClassName("prependIcon")}
              aria-hidden="true"
              size={18}
            />
            {inputElement}
          </div>
        ) : (
          inputElement
        )}
      </div>
    );
  },
};

const WithLayoutContentInput = withLayout(ContentInputInner);

function shouldHideDebounceMs(inputAction: InputAction | ""): boolean {
  return (
    inputAction === "" ||
    inputAction === "profile_full_name" ||
    isAddressDraftInputAction(inputAction)
  );
}

export const ContentInput: typeof WithLayoutContentInput = {
  ...WithLayoutContentInput,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutContentInput as {
        resolveFields?: (typeof WithLayoutContentInput)["resolveFields"];
      }
    ).resolveFields;
    const base = resolver?.(data, params);
    const inputAction = data.props.inputAction ?? "";

    const apply = (f: Record<string, unknown>) => {
      const next = { ...f };
      if (shouldHideDebounceMs(inputAction)) {
        delete next.debounceMs;
      }
      if (isPriceFilterInputAction(inputAction)) {
        delete next.inputType;
      }
      return next as Fields<WithLayout<ContentInputProps>>;
    };

    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Record<string, unknown>>).then(apply);
    }
    if (base == null) {
      return apply(
        ContentInputInner.fields as unknown as Record<string, unknown>
      );
    }
    return apply(base as Record<string, unknown>);
  },
};
