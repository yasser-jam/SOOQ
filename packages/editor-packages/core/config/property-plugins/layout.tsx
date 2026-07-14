import { LayoutPanelTop } from "lucide-react";
import type { ComponentData, Field, Fields } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { Layout } from "../components/Layout/Layout.client";
import { LayoutBoxField } from "../components/Layout/LayoutField";
import {
  defaultLayoutValue,
  type LayoutCustomField,
  type LayoutFieldProps,
  type LayoutVisibility,
} from "../components/Layout/layout-shared";
import layoutStyles from "../components/Layout/styles.module.css";
import {
  PLUGIN_GROUP_COLORS,
  PLUGIN_GROUP_LABELS,
} from "./registry";
import { isMobileEditorMetadata } from "../lib/editor-mode";
import type { PropertyPlugin } from "./types";

const getClassName = getClassNameFactory("Layout", layoutStyles);

const baseLayoutField: LayoutCustomField = {
  type: "custom",
  label: "Layout",
  metadata: { group: "layout" },
  showSpanCol: true,
  showSpanRow: true,
  showGrow: false,
  maxSpanCol: 12,
  showBorder: false,
  showShadow: false,
  render: (props) => (
    <LayoutBoxField
      {...props}
      field={{ ...baseLayoutField, ...(props.field as LayoutCustomField) }}
    />
  ),
};

const createLayoutField = (
  visibility: LayoutVisibility = {}
): LayoutCustomField => ({
  ...baseLayoutField,
  ...visibility,
  render: (props) => (
    <LayoutBoxField
      {...props}
      field={{ ...baseLayoutField, ...visibility, ...(props.field as LayoutCustomField) }}
    />
  ),
});

export type LayoutPluginOptions = LayoutVisibility & {
  /** When false, floating-position controls are hidden (e.g. images). */
  showPosition?: boolean;
};

function resolveLayoutFieldForParent(
  parent: ComponentData | null,
  options: LayoutPluginOptions,
  metadata?: { editorMode?: string }
): LayoutCustomField {
  const showPosition = options.showPosition !== false;
  const mobileExtras = isMobileEditorMetadata(metadata)
    ? { showVisibility: true }
    : {};

  if (parent?.type === "Grid") {
    return createLayoutField({
      ...options,
      ...mobileExtras,
      showSpanCol: true,
      showSpanRow: true,
      showGrow: false,
      maxSpanCol: 12,
      showPosition,
    });
  }
  if (parent?.type === "Section") {
    return createLayoutField({
      ...options,
      ...mobileExtras,
      showSpanCol: true,
      showSpanRow: true,
      showGrow: false,
      maxSpanCol: 6,
      showPosition,
    });
  }
  if (parent?.type === "Flex") {
    return createLayoutField({
      ...options,
      ...mobileExtras,
      showSpanCol: false,
      showSpanRow: false,
      showGrow: true,
      showPosition,
    });
  }

  return createLayoutField({
    ...options,
    ...mobileExtras,
    showSpanCol: false,
    showSpanRow: false,
    showGrow: false,
    showPosition,
  });
}

/**
 * التخطيط tab — spacing, sizing, grid span, floating position, and the
 * Layout wrapper around the block's render output.
 */
export function layoutPlugin(
  options: LayoutPluginOptions = {}
): PropertyPlugin {
  return {
    id: "layout",
    group: "layout",
    label: PLUGIN_GROUP_LABELS.layout,
    icon: LayoutPanelTop,
    color: PLUGIN_GROUP_COLORS.layout,
    fields: {
      layout: baseLayoutField,
    },
    defaults: {
      layout: defaultLayoutValue,
    },
    resolveFields: async (fields, _data, params) => {
      const layoutField = resolveLayoutFieldForParent(
        params.parent,
        options,
        params.metadata
      );
      return {
        ...fields,
        layout: layoutField,
      };
    },
    wrapRender: ({ children, componentProps }) => (
      <Layout
        className={getClassName()}
        layout={(componentProps as { layout?: LayoutFieldProps }).layout}
        ref={(componentProps as { puck?: { dragRef?: unknown } }).puck?.dragRef}
        puckIsEditing={
          (componentProps as { puck?: { isEditing?: boolean } }).puck?.isEditing ===
          true
        }
      >
        {children}
      </Layout>
    ),
  };
}

export { createLayoutField, baseLayoutField };
