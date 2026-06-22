import React from "react";
import { Plugin } from "@/core";
import { Settings } from "lucide-react";
import { SettingsPanel } from "./SettingsPanel";

export const settingsPlugin: Plugin = {
  name: "settings",
  label: "Settings",
  icon: <Settings size={16} />,
  render: () => <SettingsPanel />,
};
