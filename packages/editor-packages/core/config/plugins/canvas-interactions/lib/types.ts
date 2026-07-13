import type { ComponentData } from "@/core/types";

export type MenuState = {
  x: number;
  y: number;
  targetId: string;
  targetLabel: string;
};

export type Location = {
  zone: string;
  index: number;
  data: ComponentData;
  zoneLength: number;
};
