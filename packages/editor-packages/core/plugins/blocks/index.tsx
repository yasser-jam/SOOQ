"use client";

import { useCallback, useState } from "react";
import { Hammer, Plus } from "lucide-react";
import { Plugin } from "../../types";
import { Components } from "../../components/Puck/components/Components";
import { AddSectionModal } from "../../config/plugins/shopify-editor/AddSectionModal";
import { Button } from "@workspace/ui/components/button";
import styles from "./styles.module.css";
import { getClassNameFactory } from "../../lib";

const getClassName = getClassNameFactory("BlocksPlugin", styles);

function BlocksPanel() {
  const [isModalOpen, setModalOpen] = useState(false);
  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <div className={getClassName()}>
      <div className={getClassName("addSection")}>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={openModal}
          title="إضافة قسم"
        >
          <Plus data-icon="inline-start" />
          أضف قسم
        </Button>
      </div>
      <Components />
      <AddSectionModal open={isModalOpen} onClose={closeModal} />
    </div>
  );
}

export const blocksPlugin: () => Plugin = () => ({
  name: "blocks",
  label: "العناصر",
  render: () => <BlocksPanel />,
  icon: <Hammer />,
});
