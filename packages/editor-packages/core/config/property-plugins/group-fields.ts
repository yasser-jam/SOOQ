import type { Field } from "@/core/types";
import type { PropertyPlugin } from "./types";
import {
  PLUGIN_GROUP_ORDER,
  type PropertyPluginGroup,
} from "./registry";
import {
  groupFieldNames,
  type FieldGroup,
} from "../../components/Puck/components/Fields/field-groups";

export type PluginTab = {
  pluginId: string;
  group: PropertyPluginGroup;
  label: string;
  fieldNames: string[];
};

/**
 * Group resolved fields by the block's registered property plugins.
 * Falls back to name-based classification for blocks not yet migrated.
 */
export function groupFieldsByPlugins(
  fields: Record<string, Field | undefined>,
  plugins: PropertyPlugin[]
): PluginTab[] {
  const pluginByGroup = new Map<PropertyPluginGroup, PropertyPlugin>();
  for (const plugin of plugins) {
    if (!pluginByGroup.has(plugin.group)) {
      pluginByGroup.set(plugin.group, plugin);
    }
  }

  const grouped: Record<PropertyPluginGroup, string[]> = {
    content: [],
    layout: [],
    background: [],
    typography: [],
    border: [],
    advanced: [],
  };

  for (const [name, field] of Object.entries(fields)) {
    if (!field || field.type === "slot") continue;
    const group = (field.metadata as { group?: string } | undefined)?.group;
    if (
      group === "content" ||
      group === "layout" ||
      group === "background" ||
      group === "typography" ||
      group === "border" ||
      group === "advanced"
    ) {
      grouped[group].push(name);
    }
  }

  return PLUGIN_GROUP_ORDER.filter((group) => grouped[group].length > 0).map(
    (group) => {
      const plugin = pluginByGroup.get(group);
      return {
        pluginId: plugin?.id ?? group,
        group,
        label: plugin?.label ?? group,
        fieldNames: grouped[group],
      };
    }
  );
}

/**
 * Resolve tabs for the properties sidebar — plugin-aware when metadata
 * carries `propertyPlugins`, otherwise legacy name-based grouping.
 */
export function resolvePropertyTabs(
  fields: Record<string, Field | undefined>,
  plugins?: PropertyPlugin[]
): PluginTab[] {
  if (plugins && plugins.length > 0) {
    return groupFieldsByPlugins(fields, plugins);
  }

  const legacy = groupFieldNames(fields);
  return PLUGIN_GROUP_ORDER.filter(
    (group) => legacy[group as FieldGroup].length > 0
  ).map((group) => ({
    pluginId: group,
    group,
    label: group,
    fieldNames: legacy[group as FieldGroup],
  }));
}
