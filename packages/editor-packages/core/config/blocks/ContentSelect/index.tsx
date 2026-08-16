"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import {
  SELECT_ACTION_OPTIONS,
  type SelectAction,
} from "../../content/select-actions";
import { ENUM_MAPS } from "../../content/enum-labels";
import { useBoundData } from "../../binding";
import { useStore } from "../../store-context";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";
import styles from "../ContentInput/styles.module.css";

const getClassName = getClassNameFactory("ContentInput", styles);

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
    const { returnDraft, actions } = useStore();
    const { data } = useBoundData();

    const orderItemId =
      typeof data?.item === "object" &&
      data.item != null &&
      "orderItemId" in data.item
        ? String((data.item as { orderItemId?: string }).orderItemId ?? "")
        : "";

    const options = useMemo(() => {
      if (enumMapKey && enumMapKey in ENUM_MAPS) {
        return Object.entries(ENUM_MAPS[enumMapKey as keyof typeof ENUM_MAPS]).map(
          ([value, entry]) => ({
            value,
            label: entry.label,
          })
        );
      }
      return [];
    }, [enumMapKey]);

    const boundValue =
      selectAction === "return_item_condition" && orderItemId
        ? (returnDraft.items[orderItemId]?.condition ?? "OPENED")
        : options[0]?.value ?? "";

    const [localValue, setLocalValue] = useState(boundValue);

    useEffect(() => {
      setLocalValue(boundValue);
    }, [boundValue]);

    const handleChange = (next: string) => {
      setLocalValue(next);
      if (puck.isEditing || !orderItemId) return;

      if (selectAction === "return_item_condition") {
        actions.orders.setReturnItemCondition(orderItemId, next);
      }
    };

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
