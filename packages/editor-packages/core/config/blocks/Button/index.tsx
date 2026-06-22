import React, { MouseEvent } from "react";
import { ComponentConfig, Fields } from "@/core/types";
import { Button as _Button } from "@/core/components/Button";
import {
  type ButtonAction,
  BUTTON_ACTION_OPTIONS,
  buttonActionLabel,
} from "../../content/button-actions";
import { WithLayout, withLayout } from "../../components/Layout";
import {
  linkField,
  resolveHrefLegacy,
  resolveLinkTarget,
  EMPTY_LINK,
  type LinkValue,
} from "../../fields/LinkField";

export type ButtonProps = WithLayout<{
  label: string;
  buttonAction: ButtonAction;
  /**
   * Structured navigation target. New blocks populate this; older blocks may
   * still have only `href`. The render function prefers `link` when present
   * and falls back to `href` for back-compat.
   */
  link: LinkValue;
  /** @deprecated use `link`. Kept for backward compatibility with old JSON. */
  href?: string;
  variant: "primary" | "secondary";
}>;

const buttonFields = {
  label: {
    type: "text" as const,
    placeholder: "Lorem ipsum...",
    contentEditable: true,
  },
  buttonAction: {
    type: "select" as const,
    label: "الإجراء",
    options: BUTTON_ACTION_OPTIONS,
  },
  link: linkField({ label: "الوجهة" }),
  variant: {
    type: "radio" as const,
    options: [
      { label: "primary", value: "primary" },
      { label: "secondary", value: "secondary" },
    ],
  },
};

function filterButtonHrefFields(
  fields: Fields<ButtonProps>,
  data: { props?: { buttonAction?: ButtonAction } }
): Fields<ButtonProps> {
  const action = data.props?.buttonAction ?? "link";
  if (action === "link") return fields;
  // Hide the link field when the button performs an in-app action rather
  // than navigation — the action handler runs instead of an href.
  const { link: _l, ...rest } = fields as Record<string, unknown>;
  return rest as Fields<ButtonProps>;
}

const ButtonInner: ComponentConfig<ButtonProps> = {
  label: "الزر",
  fields: buttonFields,
  defaultProps: {
    label: "الزر",
    buttonAction: "link",
    link: EMPTY_LINK,
    variant: "primary",
  },
  render: ({
    link,
    href: legacyHref,
    variant,
    label,
    buttonAction: actionProp,
    puck,
  }) => {
    const buttonAction = actionProp ?? "link";
    const onFunctionalClick = (e: MouseEvent) => {
      e.preventDefault();
      if (puck.isEditing) return;
      window.alert(
        `Button action: ${buttonAction} — ${buttonActionLabel(buttonAction)}`
      );
    };

    if (buttonAction !== "link") {
      return (
        <div>
          <_Button
            type="button"
            variant={variant}
            size="large"
            tabIndex={puck.isEditing ? -1 : undefined}
            onClick={onFunctionalClick}
          >
            {label}
          </_Button>
        </div>
      );
    }

    // Prefer the new structured `link` prop; fall back to legacy string href.
    const resolvedHref = resolveHrefLegacy(link, legacyHref) ?? "#";
    const newTab = resolveLinkTarget(link) === "_blank";

    return (
      <div>
        <_Button
          href={puck.isEditing ? "#" : resolvedHref}
          variant={variant}
          size="large"
          tabIndex={puck.isEditing ? -1 : undefined}
          newTab={puck.isEditing ? false : newTab}
        >
          {label}
        </_Button>
      </div>
    );
  },
};

const WithLayoutButton = withLayout(ButtonInner);

export const Button: typeof WithLayoutButton = {
  ...WithLayoutButton,
  resolveFields: (data, params) => {
    const base = (
      WithLayoutButton as { resolveFields?: (typeof WithLayoutButton)["resolveFields"] }
    ).resolveFields?.(data, params);
    if (base != null && typeof (base as Promise<unknown>).then === "function") {
      return (base as Promise<Fields<ButtonProps>>).then((f) =>
        filterButtonHrefFields(f, data)
      );
    }
    if (base == null) {
      return filterButtonHrefFields(
        ButtonInner.fields as Fields<ButtonProps>,
        data
      );
    }
    return filterButtonHrefFields(base as Fields<ButtonProps>, data);
  },
};
