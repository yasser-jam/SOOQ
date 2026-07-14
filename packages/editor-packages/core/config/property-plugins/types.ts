import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type {
  ComponentConfig,
  DefaultComponentProps,
  Field,
  Fields,
  ComponentData,
  AppState,
} from "@/core/types";
import type { ComponentMetadata } from "@/core/types";
import type { PropertyPluginGroup } from "./registry";

export type PropertyPlugin = {
  id: string;
  group: PropertyPluginGroup;
  label: string;
  icon: LucideIcon;
  color: { color: string; tint: string };
  fields?: Record<string, Field>;
  defaults?: Record<string, unknown>;
  renderTab?: React.FC<{ readOnly?: boolean }>;
  wrapRender?: React.FC<{ children: ReactNode; componentProps: any }>;
  resolveFields?: (
    fields: Record<string, Field>,
    data: Omit<ComponentData, "type">,
    params: {
      changed: Record<string, boolean>;
      fields: Record<string, Field>;
      lastFields: Record<string, Field>;
      lastData: Omit<ComponentData, "type"> | null;
      metadata: ComponentMetadata;
      appState: AppState;
      parent: ComponentData | null;
    }
  ) => Record<string, Field> | Promise<Record<string, Field>>;
};

export type BlockConfig<Props extends DefaultComponentProps = DefaultComponentProps> = {
  label?: string;
  propertyPlugins: PropertyPlugin[];
  defaultProps?: Props;
  render: ComponentConfig<Props>["render"];
  resolveFields?: ComponentConfig<Props>["resolveFields"];
  resolveData?: ComponentConfig<Props>["resolveData"];
  resolvePermissions?: ComponentConfig<Props>["resolvePermissions"];
  inline?: boolean;
  metadata?: ComponentMetadata;
};
