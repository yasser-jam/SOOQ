import React from "react";
import { ComponentConfig } from "@/core";
import styles from "./styles.module.css";
import { getClassNameFactory } from "@/core/lib";

const getClassName = getClassNameFactory("Blank", styles);

export type BlankProps = {
  message: string;
};

export const Blank: ComponentConfig<BlankProps> = {
  label: "Placeholder",
  fields: {
    message: { type: "text", label: "الرسالة" },
  },
  defaultProps: {
    message: "Placeholder block",
  },
  render: ({ message }) => {
    return <div className={getClassName()}>{message}</div>;
  },
};
