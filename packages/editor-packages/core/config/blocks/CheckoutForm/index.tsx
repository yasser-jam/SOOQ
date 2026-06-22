import React from "react";
import { ComponentConfig } from "@/core/types";
import { withLayout } from "../../components/Layout";
import { CheckoutFormClient } from "./CheckoutFormClient";
import type { CheckoutFormProps } from "./types";

export type { CheckoutFormProps };

const CheckoutFormInner: ComponentConfig<CheckoutFormProps> = {
  label: "Checkout Form",

  fields: {
    showDataHints: {
      type: "radio",
      label: "إظهار تلميحات الجلسة",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
  },

  defaultProps: {
    showDataHints: true,
  },

  render: (props) => <CheckoutFormClient {...props} />,
};

export const CheckoutForm = withLayout(CheckoutFormInner);
