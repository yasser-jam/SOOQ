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
import type { ValueContext } from "../../binding";
import { useBoundValue } from "../../binding";
import { useStore } from "../../store-context";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ContentSwitch", styles);

export type ContentSwitchProps = WithLayout<{
  label: BilingualString | string;
  name: string;
  helperText: BilingualString | string;
  defaultChecked: boolean;
  labelPosition: "start" | "end";
  switchAction: SwitchAction | "";
  checkedValueContext?: ValueContext | null;
}>;

const ContentSwitchInner: ComponentConfig<ContentSwitchProps> = {
  label: "مفتاح تبديل",

  fields: {
    label: bilingualTextField({ label: "التسمية" }),
    name: { type: "text", label: "الاسم (للإرسال)" },
    helperText: bilingualTextField({ label: "نص مساعد" }),
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
    label: { ar: "المتوفر فقط", en: "In stock only" },
    name: "in-stock-only",
    helperText: { ar: "", en: "" },
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
    checkedValueContext,
    puck,
  }) => {
    const { language } = useActiveLanguage();
    const resolvedLabel = pickLang(label, language);
    const resolvedHelperText = pickLang(helperText, language);
    const { productsPage, customer, actions } = useStore();
    const contextChecked = useBoundValue("", checkedValueContext) === "true";

    const isInStockFilter = switchAction === "filter_in_stock_only";
    const isMarketingEmail = switchAction === "marketing_email_opt_in";
    const isMarketingSms = switchAction === "marketing_sms_opt_in";
    const isAddressDefault = switchAction === "address_is_default";
    const isSwitchActionBound =
      isInStockFilter || isMarketingEmail || isMarketingSms || isAddressDefault;

    const boundChecked = isInStockFilter
      ? productsPage.inStockOnly
      : isMarketingEmail
        ? (customer.preferences?.emailOptIn ?? false)
        : isMarketingSms
          ? (customer.preferences?.smsOptIn ?? false)
          : isAddressDefault
            ? customer.addressDraft.isDefault
            : checkedValueContext?.path
              ? contextChecked
              : defaultChecked;

    const [localChecked, setLocalChecked] = useState(boundChecked);

    useEffect(() => {
      if (!isSwitchActionBound && !checkedValueContext?.path) return;
      setLocalChecked(boundChecked);
    }, [boundChecked, checkedValueContext?.path, isSwitchActionBound]);

    const handleChange = async (checked: boolean) => {
      setLocalChecked(checked);
      if (puck.isEditing) return;

      if (isInStockFilter) {
        actions.productsPage.setInStockOnly(checked);
        return;
      }

      if (isMarketingEmail) {
        await actions.customer.setMarketingPref("email", checked);
        return;
      }

      if (isMarketingSms) {
        await actions.customer.setMarketingPref("sms", checked);
        return;
      }

      if (isAddressDefault) {
        actions.customer.setAddressDraftField("isDefault", checked);
      }
    };

    const inputId = `cs-${name}`;
    const helperId = resolvedHelperText.trim() ? `${inputId}-helper` : undefined;

    return (
      <div className={getClassName({ labelEnd: labelPosition === "end" })}>
        <label className={getClassName("row")} htmlFor={inputId}>
          {resolvedLabel.trim() ? (
            <span className={getClassName("label")}>{resolvedLabel}</span>
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
              aria-label={!resolvedLabel.trim() ? name : undefined}
              onChange={(event) => void handleChange(event.target.checked)}
              {...{ [SOOQ_INPUT_ATTR]: "" }}
            />
            <span className={getClassName("thumb")} aria-hidden="true" />
          </span>
        </label>
        {helperId ? (
          <span id={helperId} className={getClassName("helper")}>
            {resolvedHelperText}
          </span>
        ) : null}
      </div>
    );
  },
};

export const ContentSwitch = withLayout(ContentSwitchInner);
