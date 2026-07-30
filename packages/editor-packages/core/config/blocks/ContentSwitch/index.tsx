"use client";

import React, { useEffect, useState } from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { SOOQ_INPUT_ATTR } from "../../lib/login-events";
import {
  SWITCH_ACTION_OPTIONS,
  type SwitchAction,
} from "../../content/switch-actions";
import { useStore } from "../../store-context";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ContentSwitch", styles);

export type ContentSwitchProps = WithLayout<{
  label: string;
  name: string;
  helperText: string;
  defaultChecked: boolean;
  labelPosition: "start" | "end";
  switchAction: SwitchAction | "";
}>;

const ContentSwitchInner: ComponentConfig<ContentSwitchProps> = {
  label: "مفتاح تبديل",

  fields: {
    label: { type: "text", label: "التسمية" },
    name: { type: "text", label: "الاسم (للإرسال)" },
    helperText: { type: "text", label: "نص مساعد" },
    defaultChecked: {
      type: "radio",
      label: "مُفعّل افتراضياً",
      options: [
        { label: "نعم", value: true },
        { label: "لا", value: false },
      ],
    },
    labelPosition: {
      type: "select",
      label: "موضع التسمية",
      options: [
        { label: "قبل المفتاح", value: "start" },
        { label: "بعد المفتاح", value: "end" },
      ],
    },
    switchAction: {
      type: "select",
      label: "الإجراء",
      options: [{ label: "بدون", value: "" }, ...SWITCH_ACTION_OPTIONS],
    },
  },

  defaultProps: {
    label: "المتوفر فقط",
    name: "in-stock-only",
    helperText: "",
    defaultChecked: false,
    labelPosition: "start",
    switchAction: "",
  },

  render: ({
    label,
    name,
    helperText,
    defaultChecked,
    labelPosition = "start",
    switchAction = "",
    puck,
  }) => {
    const { productsPage, actions } = useStore();
    const isInStockFilter = switchAction === "filter_in_stock_only";
    const [localChecked, setLocalChecked] = useState(
      isInStockFilter ? productsPage.inStockOnly : defaultChecked
    );

    useEffect(() => {
      if (!isInStockFilter) return;
      setLocalChecked(productsPage.inStockOnly);
    }, [isInStockFilter, productsPage.inStockOnly]);

    const handleChange = (checked: boolean) => {
      setLocalChecked(checked);
      if (isInStockFilter && !puck.isEditing) {
        actions.productsPage.setInStockOnly(checked);
      }
    };

    const inputId = `cs-${name}`;
    const helperId = helperText.trim() ? `${inputId}-helper` : undefined;

    return (
      <div className={getClassName({ labelEnd: labelPosition === "end" })}>
        <label className={getClassName("row")} htmlFor={inputId}>
          {label.trim() ? (
            <span className={getClassName("label")}>{label}</span>
          ) : null}
          <span className={getClassName("track")}>
            <input
              id={inputId}
              className={getClassName("input")}
              type="checkbox"
              role="switch"
              name={name}
              checked={localChecked}
              disabled={puck.isEditing}
              aria-describedby={helperId}
              aria-label={!label.trim() ? name : undefined}
              onChange={(event) => handleChange(event.target.checked)}
              {...{ [SOOQ_INPUT_ATTR]: "" }}
            />
            <span className={getClassName("thumb")} aria-hidden="true" />
          </span>
        </label>
        {helperId ? (
          <span id={helperId} className={getClassName("helper")}>
            {helperText}
          </span>
        ) : null}
      </div>
    );
  },
};

export const ContentSwitch = withLayout(ContentSwitchInner);
