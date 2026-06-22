import React from "react";
import { Plugin } from "@/core";
import { SwatchBook } from "lucide-react";
import { ThemesPanel } from "./ThemesPanel";

export const themesPlugin: Plugin = {
  name: "themes",
  label: "الثيمات",
  icon: <SwatchBook size={16} />,
  render: () => <ThemesPanel />,
};
