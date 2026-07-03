"use client";

import React from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { SOOQ_INPUT_ATTR } from "../../lib/login-events";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ContentInput", styles);

export type ContentInputProps = WithLayout<{
  label: string;
  name: string;
  inputType: "text" | "email" | "password" | "tel";
  placeholder: string;
  required: boolean;
}>;

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
  },

  defaultProps: {
    label: "حقل",
    name: "field",
    inputType: "text",
    placeholder: "",
    required: false,
  },

  render: ({ label, name, inputType, placeholder, required, puck }) => (
    <div className={getClassName()}>
      <label className={getClassName("label")} htmlFor={`ci-${name}`}>
        {label}
        {required && <span className={getClassName("required")}>*</span>}
      </label>
      <input
        id={`ci-${name}`}
        className={getClassName("input")}
        type={inputType}
        name={name}
        placeholder={placeholder}
        required={required}
        disabled={puck.isEditing}
        dir={inputType === "email" || inputType === "tel" ? "ltr" : undefined}
        {...{ [SOOQ_INPUT_ATTR]: "" }}
      />
    </div>
  ),
};

export const ContentInput = withLayout(ContentInputInner);
