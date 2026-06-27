import { Hammer } from "lucide-react";
import { Plugin } from "../../types";
import { Components } from "../../components/Puck/components/Components";
import { AddSectionTrigger } from "./AddSectionDialog";
import styles from "./styles.module.css";
import { getClassNameFactory } from "../../lib";

const getClassName = getClassNameFactory("BlocksPlugin", styles);

export const blocksPlugin: () => Plugin = () => ({
  name: "blocks",
  label: "العناصر",
  render: () => (
    <div className={getClassName()}>
      <AddSectionTrigger />
      <Components />
    </div>
  ),
  icon: <Hammer />,
});
