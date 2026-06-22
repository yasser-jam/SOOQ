import { FormInput } from "lucide-react";
import { useAppStore } from "../../store";
import { PluginInternal } from "../../types/Internal";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { Fields } from "../../components/Puck/components/Fields";
import styles from "./styles.module.css";
import { getClassNameFactory } from "../../lib";

const getClassName = getClassNameFactory("FieldsPlugin", styles);

const formatRootFocusTitle = (focus: string | null | undefined) => {
  if (!focus) return "Page";

  if (focus.startsWith("header")) return "Header";
  if (focus.startsWith("footer")) return "Footer";
  if (focus.startsWith("drawer")) return "Side Drawer";

  return (
    focus
      .replace(/^__+/, "")
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (c) => c.toUpperCase()) || "Page"
  );
};

const CurrentTitle = () => {
  const label = useAppStore((s) => {
    const selectedItem = s.selectedItem;
    const focus = s.state.ui.field.focus;

    return selectedItem
      ? s.config.components[selectedItem.type]?.label ?? selectedItem.type
      : formatRootFocusTitle(focus);
  });

  return label;
};

export const fieldsPlugin: (params?: {
  desktopSideBar?: "left" | "right";
}) => PluginInternal = ({ desktopSideBar = "right" } = {}) => ({
  name: "fields",
  label: "Fields",
  render: () => (
    <div className={getClassName()}>
      <div className={getClassName("header")}>
        <Breadcrumbs numParents={2}>
          <CurrentTitle />
        </Breadcrumbs>
      </div>
      <Fields />
    </div>
  ),
  icon: <FormInput />,
  mobileOnly: desktopSideBar === "right",
});
