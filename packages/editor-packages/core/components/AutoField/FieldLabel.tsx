import getClassNameFactory from "../../lib/get-class-name-factory";
import { Field, FieldProps } from "../../types";

import styles from "./styles.module.css";
import { ReactNode, useMemo } from "react";
import { Lock } from "lucide-react";
import { useAppStore } from "../../store";

const getClassName = getClassNameFactory("Input", styles);

export const FieldLabel = ({
  children,
  icon,
  label,
  metadata,
  el = "label",
  readOnly,
  className,
}: {
  children?: ReactNode;
  icon?: ReactNode;
  label: string;
  metadata?: Record<string, any>;
  el?: "label" | "div";
  readOnly?: boolean;
  className?: string;
}) => {
  const El = el;
  const helpText =
    metadata?.helpText ?? metadata?.description ?? metadata?.helperText;
  const example = metadata?.example;

  return (
    <El className={className}>
      <div className={getClassName("label")}>
        {icon ? <div className={getClassName("labelIcon")}>{icon}</div> : <></>}
        {label}

        {readOnly && (
          <div className={getClassName("disabledIcon")} title="Read-only">
            <Lock size="12" />
          </div>
        )}
      </div>
      {typeof helpText === "string" && helpText.trim() ? (
        <div className={getClassName("help")}>{helpText.trim()}</div>
      ) : null}
      {typeof example === "string" && example.trim() ? (
        <div className={getClassName("example")}>Example: {example.trim()}</div>
      ) : null}
      {children}
    </El>
  );
};

export type FieldLabelPropsInternal = {
  children?: ReactNode;
  icon?: ReactNode;
  label?: string;
  metadata?: Record<string, any>;
  el?: "label" | "div";
  readOnly?: boolean;
};

export const FieldLabelInternal = ({
  children,
  icon,
  label,
  metadata,
  el = "label",
  readOnly,
}: FieldLabelPropsInternal) => {
  const overrides = useAppStore((s) => s.overrides);

  const Wrapper = useMemo(
    () => overrides.fieldLabel || FieldLabel,
    [overrides]
  );

  if (!label) {
    return <>{children}</>;
  }

  return (
    <Wrapper
      label={label}
      icon={icon}
      metadata={metadata}
      className={getClassName({ readOnly })}
      readOnly={readOnly}
      el={el}
    >
      {children}
    </Wrapper>
  );
};

export type FieldPropsInternalOptional<ValueType = any, F = Field<any>> = Omit<
  FieldProps<F, ValueType>,
  "value"
> & {
  Label?: React.FC<FieldLabelPropsInternal>;
  label?: string;
  labelIcon?: ReactNode;
  name?: string;
};

export type FieldPropsInternal<ValueType = any, F = Field<any>> = FieldProps<
  F,
  ValueType
> & {
  Label: React.FC<FieldLabelPropsInternal>;
  label?: string;
  labelIcon?: ReactNode;
  id: string;
  name?: string;
};
