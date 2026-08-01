/* eslint-disable @next/next/no-img-element */
"use client";
import React, { lazy, Suspense } from "react";
import { ComponentConfig } from "@/core/types";
import styles from "./styles.module.css";
import { getClassNameFactory } from "@/core/lib";
import dynamicIconImports from "lucide-react/dynamicIconImports";
import { withLayout, WithLayout } from "../../components/Layout";
import {
  bilingualTextField,
  pickLang,
  type BilingualString,
} from "../../fields/BilingualText";
import { useActiveLanguage } from "../../locale/LanguageContext";

const getClassName = getClassNameFactory("Card", styles);

const iconComponents = Object.keys(dynamicIconImports).reduce<
  Record<string, React.LazyExoticComponent<React.ComponentType<any>>>
>((acc, iconName) => {
  acc[iconName] = lazy((dynamicIconImports as any)[iconName]);
  return acc;
}, {});

const iconOptions = Object.keys(dynamicIconImports).map((iconName) => ({
  label: iconName,
  value: iconName,
}));

export type CardProps = WithLayout<{
  title: BilingualString | string;
  description: BilingualString | string;
  icon?: string;
  mode: "flat" | "card";
}>;

const CardInner: ComponentConfig<CardProps> = {
  fields: {
    title: bilingualTextField({
      label: "العنوان",
      contentEditable: true,
    }),
    description: bilingualTextField({
      label: "الوصف",
      mode: "textarea",
      contentEditable: true,
    }),
    icon: {
      type: "select",
      options: iconOptions,
    },
    mode: {
      type: "radio",
      options: [
        { label: "card", value: "card" },
        { label: "flat", value: "flat" },
      ],
    },
  },
  defaultProps: {
    title: { ar: "عنوان", en: "Title" },
    description: { ar: "وصف", en: "Description" },
    icon: "feather",
    mode: "flat",
  },
  render: ({ title, icon, description, mode }) => {
    const { language } = useActiveLanguage();
    const resolvedTitle = pickLang(title, language);
    const resolvedDescription = pickLang(description, language);
    const iconKey = icon
      ? iconComponents[icon]
        ? icon
        : icon.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
      : undefined;
    const IconComponent = iconKey ? iconComponents[iconKey] : undefined;
    return (
      <div className={getClassName({ [mode]: mode })}>
        <div className={getClassName("inner")}>
          <div className={getClassName("icon")}>
            {IconComponent && (
              <Suspense fallback={null}>
                <IconComponent />
              </Suspense>
            )}
          </div>

          <div className={getClassName("title")}>{resolvedTitle}</div>
          <div className={getClassName("description")}>{resolvedDescription}</div>
        </div>
      </div>
    );
  },
};

export const Card = withLayout(CardInner);
