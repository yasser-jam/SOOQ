import React from "react";
import { Plugin } from "@/core";
import { FileJson } from "lucide-react";
import { JsonViewerPanel } from "./JsonViewerPanel";

export const jsonViewerPlugin: Plugin = {
  name: "json-viewer",
  label: "JSON",
  icon: <FileJson size={16} />,
  render: () => <JsonViewerPanel />,
};
