"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout } from "../../components/Layout";
import { resolveColor, colorField } from "../../content/color-fields";
import {
  RADIUS_OPTIONS,
  resolveRadius,
} from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { useStore } from "../../store-context";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ProductSearchInput", styles);

export type ProductSearchInputProps = WithLayout<{
  placeholder: string;
  debounceMs: number;
  bgColor: string;
  textColor: string;
  borderColor: string;
  radius: string;
}>;

const ProductSearchInputInner: ComponentConfig<ProductSearchInputProps> = {
  label: "بحث المنتجات",

  fields: {
    placeholder: { type: "text", label: "نص توضيحي" },
    debounceMs: { type: "number", label: "تأخير الكتابة (مللي ثانية)" },
    bgColor: { ...colorField, label: "لون الخلفية" },
    textColor: { ...colorField, label: "لون النص" },
    borderColor: { ...colorField, label: "لون الحدود" },
    radius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
  },

  defaultProps: {
    placeholder: "ابحث عن منتج…",
    debounceMs: 250,
    bgColor: "theme-surface",
    textColor: "theme-text",
    borderColor: "theme-border",
    radius: "theme-md",
  },

  render: ({
    placeholder,
    debounceMs = 250,
    bgColor,
    textColor,
    borderColor,
    radius,
    puck,
  }) => {
    const { productsPage, actions } = useStore();
    const [localValue, setLocalValue] = useState(productsPage.search);

    useEffect(() => {
      setLocalValue(productsPage.search);
    }, [productsPage.search]);

    useEffect(() => {
      if (puck.isEditing) return;
      const timer = setTimeout(() => {
        if (localValue !== productsPage.search) {
          actions.productsPage.setSearch(localValue);
        }
      }, debounceMs);
      return () => clearTimeout(timer);
    }, [
      actions.productsPage,
      debounceMs,
      localValue,
      productsPage.search,
      puck.isEditing,
    ]);

    const inputStyle = {
      background: resolveColor(bgColor),
      color: resolveColor(textColor),
      borderColor: resolveColor(borderColor),
      borderRadius: resolveRadius(radius),
    };

    return (
      <div className={getClassName()}>
        <Search
          className={getClassName("icon")}
          aria-hidden="true"
          size={18}
        />
        <input
          className={getClassName("input")}
          type="search"
          value={localValue}
          placeholder={placeholder}
          onChange={(event) => setLocalValue(event.target.value)}
          style={inputStyle}
          aria-label={placeholder}
          dir="auto"
        />
      </div>
    );
  },
};

export const ProductSearchInput = withLayout(ProductSearchInputInner);
