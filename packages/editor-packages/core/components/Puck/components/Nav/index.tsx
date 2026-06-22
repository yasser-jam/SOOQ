import styles from "./styles.module.css";
import { KeyboardEvent, ReactNode } from "react";
import { getClassNameFactory } from "../../../../lib";

const getClassName = getClassNameFactory("Nav", styles);
const getClassNameItem = getClassNameFactory("NavItem", styles);

export type MenuItem = {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  isActive?: boolean;
  mobileOnly?: boolean;
  desktopOnly?: boolean;
};

export const MenuItem = ({
  label,
  icon,
  onClick,
  isActive,
  mobileOnly,
  desktopOnly,
}: MenuItem) => {
  const isDisabled = !onClick;

  return (
    <li
      className={getClassNameItem({
        active: isActive,
        mobileOnly,
        desktopOnly,
      })}
    >
      <button
        type="button"
        className={getClassNameItem("link")}
        onClick={onClick}
        disabled={isDisabled}
        aria-current={isActive ? "page" : undefined}
        data-puck-nav-item="true"
        title={label}
      >
        {icon && <span className={getClassNameItem("linkIcon")}>{icon}</span>}
        <span className={getClassNameItem("linkLabel")}>{label}</span>
      </button>
    </li>
  );
};

export const Nav = ({
  items,
  mobileActions,
}: {
  items: Record<string, MenuItem>;
  mobileActions?: ReactNode;
}) => {
  const handleNavKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowDown" &&
      event.key !== "ArrowUp" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        "button[data-puck-nav-item='true']:not(:disabled)"
      )
    );

    if (buttons.length === 0) return;

    const currentIndex = buttons.findIndex(
      (button) => button === document.activeElement
    );

    let nextIndex = currentIndex >= 0 ? currentIndex : 0;

    if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = buttons.length - 1;
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (nextIndex + 1 + buttons.length) % buttons.length;
    } else {
      nextIndex = (nextIndex - 1 + buttons.length) % buttons.length;
    }

    event.preventDefault();
    buttons[nextIndex]?.focus();
  };

  return (
    <nav className={getClassName()}>
      <ul
        className={getClassName("list")}
        onKeyDown={handleNavKeyDown}
        aria-label="Puck editor panels"
        title="Ctrl/Cmd + [ or ] to switch editor panels"
      >
        {Object.entries(items).map(([key, item]) => (
         <MenuItem key={key} {...item} />
        ))}
      </ul>
      {mobileActions && (
        <div className={getClassName("mobileActions")}>{mobileActions}</div>
      )}
    </nav>
  );
};
