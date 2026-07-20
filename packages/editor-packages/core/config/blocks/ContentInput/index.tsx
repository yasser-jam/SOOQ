"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ComponentConfig, Fields } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { SOOQ_INPUT_ATTR } from "../../lib/login-events";
import {
  INPUT_ACTION_OPTIONS,
  type InputAction,
} from "../../content/input-actions";
import { useStore } from "../../store-context";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ContentInput", styles);

export type ContentInputPrependIcon = "none" | "search";

export type ContentInputProps = WithLayout<{
  label: string;
  name: string;
  inputType: "text" | "email" | "password" | "tel" | "search";
  placeholder: string;
  required: boolean;
  prependIcon: ContentInputPrependIcon;
  inputAction: InputAction | "";
  debounceMs: number;
}>;

const PREPEND_ICON_OPTIONS = [
  { label: "بدون", value: "none" },
  { label: "بحث", value: "search" },
];

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
    puck,
  }) => {
    const { productsPage, actions } = useStore();
    const isSearchProducts = inputAction === "search_products";
    const [localValue, setLocalValue] = useState(
      isSearchProducts ? productsPage.search : ""
    );

    useEffect(() => {
      if (!isSearchProducts) return;
      setLocalValue(productsPage.search);
    }, [isSearchProducts, productsPage.search]);

    useEffect(() => {
      if (!isSearchProducts || puck.isEditing) return;
      const timer = setTimeout(() => {
        if (localValue !== productsPage.search) {
          actions.searchProducts(localValue);
        }
      }, debounceMs);
      return () => clearTimeout(timer);
    }, [
      actions,
      debounceMs,
      isSearchProducts,
      localValue,
      productsPage.search,
      puck.isEditing,
    ]);

    const resolvedType =
      inputType === "search" || isSearchProducts ? "search" : inputType;
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
        dir={
          inputType === "email" || inputType === "tel" ? "ltr" : undefined
        }
        value={isSearchProducts ? localValue : undefined}
        onChange={
          isSearchProducts
            ? (event) => setLocalValue(event.target.value)
            : undefined
        }
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
      if (inputAction !== "search_products") {
        delete next.debounceMs;
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
