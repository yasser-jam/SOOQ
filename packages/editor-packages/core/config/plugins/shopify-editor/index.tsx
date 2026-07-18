import React from "react";
import { Layers } from "lucide-react";
import type { Plugin } from "@/core";
import { ShopifyOutlinePanel } from "./ShopifyOutlinePanel";

/**
 * Shopify-style editor plugin.
 *
 * Registers under the name `"sections"` so it coexists with Puck's built-in
 * Outline plugin ("شجرة العناصر"). Same-named plugins override built-ins in
 * Layout; using a distinct name keeps both tabs visible in the left sidebar.
 *
 * Persistence: every mutation dispatched from this plugin flows through the
 * Puck reducer → `onChange` → `store_config.json`. No editor-only state.
 */
export const shopifyOutlinePlugin: Plugin = {
  name: "sections",
  label: "الأقسام",
  icon: <Layers size={18} />,
  render: () => <ShopifyOutlinePanel />,
};

export { AddSectionModal } from "./AddSectionModal";
export { ShopifyOutlinePanel } from "./ShopifyOutlinePanel";
export { sectionCatalog } from "./section-catalog";
