import React from "react";
import { Plugin } from "@/core";
import { LayoutTemplate } from "lucide-react";
import { PagesPanel } from "./PagesPanel";

export const pagesPlugin: Plugin = {
  name: "pages",
  label: "الصفحات",
  icon: <LayoutTemplate size={16} />,
  render: () => <PagesPanel />,
};
