import { FormInput } from "lucide-react";
import { useAppStore } from "../../store";
import { PluginInternal } from "../../types/Internal";
import { Breadcrumbs } from "../../components/Breadcrumbs";
import { Fields } from "../../components/Puck/components/Fields";
import styles from "./styles.module.css";
import { getClassNameFactory } from "../../lib";

const getClassName = getClassNameFactory("FieldsPlugin", styles);

const CurrentTitle = () => {
  const label = useAppStore((s) => {
    const selectedItem = s.selectedItem;
    if (!selectedItem) return null;

    return (
      s.config.components[selectedItem.type]?.label ?? selectedItem.type
    );
  });

  return label;
};

const FieldsPluginBody = () => {
  const selectedItem = useAppStore((s) => s.selectedItem);

  if (!selectedItem) {
    return null;
  }

  return (
    <>
      <div className={getClassName("header")}>
        <Breadcrumbs numParents={2}>
          <CurrentTitle />
        </Breadcrumbs>
      </div>
      <Fields />
    </>
  );
};

export const fieldsPlugin: (params?: {
  desktopSideBar?: "left" | "right";
}) => PluginInternal = ({ desktopSideBar = "right" } = {}) => ({
  name: "fields",
  label: "Fields",
  render: () => (
    <div className={getClassName()}>
      <FieldsPluginBody />
    </div>
  ),
  icon: <FormInput />,
  mobileOnly: desktopSideBar === "right",
});
