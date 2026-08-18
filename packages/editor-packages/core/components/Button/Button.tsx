"use client";

import { ReactNode, useEffect, useState } from "react";
import styles from "./Button.module.css";
import getClassNameFactory from "../../lib/get-class-name-factory";
import { Loader } from "../Loader";
import { filterDataAttrs } from "../../lib/filter-data-attrs";
import { SmartLink } from "../SmartLink";

const getClassName = getClassNameFactory("Button", styles);

export const Button = ({
  children,
  href,
  onClick,
  variant = "primary",
  type,
  disabled,
  tabIndex,
  newTab,
  fullWidth,
  icon,
  size = "medium",
  loading: loadingProp = false,
  ...props
}: {
  children: ReactNode;
  href?: string;
  onClick?: (e: any) => void | Promise<void>;
  variant?: "primary" | "secondary";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  tabIndex?: number;
  newTab?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  size?: "medium" | "large";
  loading?: boolean;
}) => {
  const [loading, setLoading] = useState(loadingProp);

  useEffect(() => setLoading(loadingProp), [loadingProp]);

  const dataAttrs = filterDataAttrs(props);
  const className = getClassName({
    primary: variant === "primary",
    secondary: variant === "secondary",
    disabled,
    fullWidth,
    [size]: true,
  });
  const handleClick = (e: any) => {
    if (!onClick) return;

    setLoading(true);
    Promise.resolve(onClick(e)).then(() => {
      setLoading(false);
    });
  };
  const content = (
    <>
      {icon && <div className={getClassName("icon")}>{icon}</div>}
      {children}
      {loading && (
        <div className={getClassName("spinner")}>
          <Loader size={14} />
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <SmartLink
        className={className}
        onClick={handleClick}
        tabIndex={tabIndex}
        target={newTab ? "_blank" : undefined}
        rel={newTab ? "noreferrer" : undefined}
        href={href}
        {...dataAttrs}
      >
        {content}
      </SmartLink>
    );
  }

  const ElementType = type ? "button" : "span";

  return (
    <ElementType
      className={className}
      onClick={handleClick}
      type={type}
      disabled={disabled || loading}
      tabIndex={tabIndex}
      {...dataAttrs}
    >
      {content}
    </ElementType>
  );
};
