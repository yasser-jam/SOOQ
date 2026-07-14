import type { Field } from "@/core/types";
import type { LayoutPluginOptions } from "./layout";
import { contentPlugin } from "./content";
import { layoutPlugin } from "./layout";
import { borderPlugin } from "./border";
import { imagePlugin } from "./image";

export type { PropertyPlugin, BlockConfig } from "./types";
export { createBlock } from "./create-block";
export { contentPlugin } from "./content";
export { layoutPlugin } from "./layout";
export { borderPlugin } from "./border";
export { backgroundPlugin } from "./background";
export { typographyPlugin } from "./typography";
export { advancedPlugin } from "./advanced";
export { imagePlugin } from "./image";
export {
  useBlockProps,
  useBlockProp,
  useBlockPatch,
  useLayout,
  useLayoutPatch,
} from "./hooks";
export {
  PLUGIN_GROUP_LABELS,
  PLUGIN_GROUP_ORDER,
  PLUGIN_GROUP_COLORS,
  PLUGIN_GROUP_ICONS,
  type PropertyPluginGroup,
} from "./registry";
export {
  groupFieldsByPlugins,
  resolvePropertyTabs,
  type PluginTab,
} from "./group-fields";

/** Content + layout + border — most text/media blocks. */
export function standardContentPlugins(
  contentFields: Record<string, Field>,
  layoutOptions?: LayoutPluginOptions
) {
  return [
    contentPlugin(contentFields),
    layoutPlugin(layoutOptions),
    borderPlugin(),
  ];
}

/** Image content + layout (no float) + border. */
export function imageBlockPlugins(
  imageFields: Record<string, Field>,
  layoutOptions?: LayoutPluginOptions
) {
  return [
    imagePlugin(imageFields),
    layoutPlugin({ showPosition: false, ...layoutOptions }),
    borderPlugin(),
  ];
}

/** Content + layout only — buttons and compact controls. */
export function buttonBlockPlugins(
  contentFields: Record<string, Field>,
  layoutOptions?: LayoutPluginOptions
) {
  return [contentPlugin(contentFields), layoutPlugin(layoutOptions)];
}
