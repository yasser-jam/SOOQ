import { Hammer } from "lucide-react";
import { Plugin } from "../../types";
import { Components } from "../../components/Puck/components/Components";
import styles from "./styles.module.css";
import { getClassNameFactory } from "../../lib";

const getClassName = getClassNameFactory("BlocksPlugin", styles);

export const blocksPlugin: () => Plugin = () => ({
  name: "blocks",
  label: "العناصر",
  render: () => (
    <div className={getClassName()}>
      {/* Legacy AddSectionTrigger intentionally omitted — use Shopify AddSectionModal instead.
          See plugins/blocks/AddSectionDialog.tsx (kept for reference, do not re-wire). */}
      <Components />
    </div>
  ),
  icon: <Hammer />,
});
