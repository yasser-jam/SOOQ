import React from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { WithLayout, withLayout, omitLayoutField } from "../../components/Layout";
import { spacingOptions } from "../../options";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("Space", styles);

const SPACE_SIZE_OPTIONS = spacingOptions.map((option) => ({
  label: option.label,
  value: option.value.replace(/px$/, ""),
}));

export type SpaceProps = WithLayout<{
  size: string;
}>;

function resolveSpaceSize(value: string | undefined): string {
  if (!value) return "24px";
  if (value.startsWith("theme-")) {
    return `${value.slice(6)}px`;
  }
  return value.includes("px") ? value : `${value}px`;
}

const SpaceInner: ComponentConfig<SpaceProps> = {
  label: "فراغ",
  fields: {
    size: themeFixedSelectField({
      label: "القياس",
      themeOptions: SPACE_SIZE_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
  },
  defaultProps: {
    size: "theme-24",
  },
  resolveData: ({ props }) => {
    let size = props.size;
    if (size && !size.startsWith("theme-") && size.endsWith("px")) {
      const n = size.replace(/px$/, "");
      size = SPACE_SIZE_OPTIONS.some((o) => o.value === n) ? `theme-${n}` : n;
    }
    return {
      props: {
        size: size ?? "theme-24",
      },
    };
  },
  inline: true,
  render: ({ size }) => {
    const px = resolveSpaceSize(size);
    return (
      <div
        className={getClassName({ vertical: "vertical" })}
        style={{ "--size": px } as React.CSSProperties}
      />
    );
  },
};

const WithLayoutSpace = withLayout(SpaceInner);

export const Space: typeof WithLayoutSpace = {
  ...WithLayoutSpace,
  resolveFields: (data, params) => {
    const resolver = (
      WithLayoutSpace as { resolveFields?: (typeof WithLayoutSpace)["resolveFields"] }
    ).resolveFields;
    const base = resolver?.(data, params);
    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Fields<SpaceProps>>).then((f) => omitLayoutField(f));
    }
    if (base == null) {
      return omitLayoutField(SpaceInner.fields as Fields<SpaceProps>);
    }
    return omitLayoutField(base as Fields<SpaceProps>);
  },
};
