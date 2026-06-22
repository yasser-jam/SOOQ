import React from "react";
import { Layers } from "lucide-react";
import type { Plugin } from "@/core";
import { ShopifyOutlinePanel } from "./ShopifyOutlinePanel";

/**
 * Shopify-style editor plugin.
 *
 * Registers under the name `"outline"` so it replaces Puck's built-in Outline
 * plugin (see packages/core/components/Puck/components/Layout/index.tsx: the
 * forEach delete+reassign makes same-named plugins override). Pair with
 * `builtinPlugins={["outline"]}` on <Puck> to hide the Blocks palette tab so
 * the left sidebar looks and behaves like Shopify's theme editor.
 *
 * Persistence: every mutation dispatched from this plugin flows through the
 * Puck reducer → `onChange` → `store_config.json`. No editor-only state.
 */
export const shopifyOutlinePlugin: Plugin = {
  name: "outline",
  label: "الأقسام",
  icon: <Layers size={18} />,
  render: () => <ShopifyOutlinePanel />,
};

export { AddSectionModal } from "./AddSectionModal";
export { ShopifyOutlinePanel } from "./ShopifyOutlinePanel";
export { sectionCatalog } from "./section-catalog";
