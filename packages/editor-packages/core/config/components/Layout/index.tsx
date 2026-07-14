import {
  ComponentConfig,
  ComponentConfigParams,
  DefaultComponentProps,
} from "@/core/types";
import type { LeftOrExactRight } from "@/core/types/Internal";
import { getClassNameFactory } from "@/core/lib";
import { Layout } from "./Layout.client";
import { LayoutBoxField } from "./LayoutField";
import { borderDesignField } from "../../fields/BorderField";
import styles from "./styles.module.css";
import {
  defaultLayoutValue,
  type LayoutCustomField,
  type LayoutFieldProps,
  type LayoutVisibility,
} from "./layout-shared";
import type { Fields } from "@/core/types";
import { isMobileEditorMetadata } from "../../lib/editor-mode";

export type { FloatPresetKey, WithLayout } from "./layout-shared";
export { getFloatInsetStyleFromPreset } from "./layout-shared";

const getClassName = getClassNameFactory("Layout", styles);

export const layoutField: LayoutCustomField = {
  type: "custom",
  label: "Layout",
  metadata: { group: "layout" },
  showSpanCol: true,
  showSpanRow: true,
  showGrow: false,
  maxSpanCol: 12,
  // Border + shadow moved out of this box field into the dedicated
  // «الحدود» tab (the `layoutBorder` designer registered by withLayout).
  showBorder: false,
  showShadow: false,
  render: (props) => (
    <LayoutBoxField
      {...props}
      field={{ ...layoutField, ...(props.field as LayoutCustomField) }}
    />
  ),
};

export { Layout };

const createLayoutField = (
  visibility: LayoutVisibility = {}
): LayoutCustomField => ({
  ...layoutField,
  ...visibility,
  render: (props) => (
    <LayoutBoxField
      {...props}
      field={{ ...layoutField, ...visibility, ...(props.field as LayoutCustomField) }}
    />
  ),
});

function mobileLayoutExtras(
  metadata?: { editorMode?: string }
): LayoutVisibility {
  return isMobileEditorMetadata(metadata) ? { showVisibility: true } : {};
}

export function withLayout<
  Props extends LeftOrExactRight<
    Props,
    DefaultComponentProps,
    ComponentConfigParams
  >
>(componentConfig: ComponentConfig<Props>): ComponentConfig<Props> {
  return {
    ...componentConfig,
    fields: {
      ...componentConfig.fields,
      layout: layoutField,
    },
    defaultProps: {
      ...componentConfig.defaultProps,
      layout: {
        ...defaultLayoutValue,
        ...componentConfig.defaultProps?.layout,
      },
    },
    resolveFields: async (data, params) => {
      const resolvedFromConfig =
        (componentConfig.resolveFields
          ? await componentConfig.resolveFields(data, params)
          : params.fields) ?? params.fields;

      // Border + shadow live in their own «الحدود» tab via this designer;
      // blocks opt out with hideLayoutBorder (which removes it again).
      const withBorderDesigner = {
        ...resolvedFromConfig,
        layoutBorder: borderDesignField,
      };

      const mobileExtras = mobileLayoutExtras(params.metadata);

      if (params.parent?.type === "Grid") {
        return {
          ...withBorderDesigner,
          layout: createLayoutField({
            showSpanCol: true,
            showSpanRow: true,
            showGrow: false,
            maxSpanCol: 12,
            ...mobileExtras,
          }),
        };
      }
      if (params.parent?.type === "Section") {
        return {
          ...withBorderDesigner,
          layout: createLayoutField({
            showSpanCol: true,
            showSpanRow: true,
            showGrow: false,
            maxSpanCol: 6,
            ...mobileExtras,
          }),
        };
      }
      if (params.parent?.type === "Flex") {
        return {
          ...withBorderDesigner,
          layout: createLayoutField({
            showSpanCol: false,
            showSpanRow: false,
            showGrow: true,
            ...mobileExtras,
          }),
        };
      }

      return {
        ...withBorderDesigner,
        layout: createLayoutField({
          showSpanCol: false,
          showSpanRow: false,
          showGrow: false,
          ...mobileExtras,
        }),
      };
    },
    inline: true,
    render: (props: Parameters<typeof componentConfig.render>[0]) => {
      const layoutProps = props as Parameters<
        typeof componentConfig.render
      >[0] & { layout?: LayoutFieldProps };
      return (
        <Layout
          className={getClassName()}
          layout={layoutProps.layout as LayoutFieldProps}
          ref={layoutProps.puck?.dragRef}
          puckIsEditing={layoutProps.puck?.isEditing === true}
        >
          {componentConfig.render(props as never)}
        </Layout>
      );
    },
  } as ComponentConfig<Props>;
}

export function hideLayoutPosition<Props extends DefaultComponentProps>(fields: Fields<Props>): Fields<Props> {
  const f = fields.layout;
  if (f && typeof f === "object" && "render" in f) {
    return { ...fields, layout: { ...f, showPosition: false } } as Fields<Props>;
  }
  return fields;
}

export function hideLayoutBorder<Props extends DefaultComponentProps>(fields: Fields<Props>): Fields<Props> {
  const next = { ...fields } as Record<string, unknown>;
  // The border designer is its own field now — opting out means removing it.
  delete next.layoutBorder;
  const f = fields.layout;
  if (f && typeof f === "object" && "render" in f) {
    next.layout = { ...f, showBorder: false };
  }
  return next as Fields<Props>;
}

export function omitLayoutField<Props extends DefaultComponentProps>(
  fields: Fields<Props>
): Fields<Props> {
  const next = { ...fields } as Record<string, unknown>;
  delete next.layout;
  return next as Fields<Props>;
}
