import React from "react";
import { Plugin } from "@/core";
import { Layers } from "lucide-react";
import { ZonesPanel } from "./ZonesPanel";

export const zonesPlugin: Plugin = {
  name: "zones",
  label: "المناطق",
  icon: <Layers size={16} />,
  render: () => <ZonesPanel />,
};
