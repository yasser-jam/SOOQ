import type { ComponentConfig, DefaultComponentProps, Field } from "@/core/types";
import type { LeftOrExactRight } from "@/core/types/Internal";
import type { ComponentConfigParams } from "@/core/types";
import type { BlockConfig, PropertyPlugin } from "./types";

export function createBlock<
  Props extends LeftOrExactRight<Props, DefaultComponentProps, ComponentConfigParams>
>(config: BlockConfig<Props>): ComponentConfig<Props> {
  const allFields: Record<string, Field> = {};
  const allDefaults: Record<string, unknown> = {};

  for (const plugin of config.propertyPlugins) {
    if (plugin.fields) {
      for (const [name, field] of Object.entries(plugin.fields)) {
        const f = field as Field & { metadata?: Record<string, unknown> };
        allFields[name] = {
          ...f,
          metadata: { ...f.metadata, group: plugin.group },
        } as Field;
      }
    }
    if (plugin.defaults) {
      Object.assign(allDefaults, plugin.defaults);
    }
  }

  const pluginResolvers = config.propertyPlugins
    .filter((p) => p.resolveFields)
    .map((p) => p.resolveFields!);

  const hasPluginResolvers = pluginResolvers.length > 0;
  const hasBlockResolver = !!config.resolveFields;

  const chainedResolveFields =
    hasPluginResolvers || hasBlockResolver
      ? async (data: any, params: any) => {
          let fields = params.fields;

          for (const resolver of pluginResolvers) {
            fields = await resolver(fields as any, data, params);
          }

          if (config.resolveFields) {
            fields = await config.resolveFields(data, { ...params, fields });
          }

          return fields;
        }
      : undefined;

  const wrappers = config.propertyPlugins
    .filter((p) => p.wrapRender)
    .map((p) => p.wrapRender!);

  let render = config.render;

  if (wrappers.length > 0) {
    const originalRender = config.render;
    render = ((props: any) => {
      let element = (originalRender as any)(props);
      for (const Wrapper of wrappers) {
        element = <Wrapper componentProps={props}>{element}</Wrapper>;
      }
      return element;
    }) as typeof config.render;
  }

  return {
    label: config.label,
    fields: allFields,
    defaultProps: { ...allDefaults, ...config.defaultProps } as any,
    render,
    resolveFields: chainedResolveFields,
    resolveData: config.resolveData,
    resolvePermissions: config.resolvePermissions,
    inline: config.inline ?? true,
    metadata: {
      ...config.metadata,
      propertyPlugins: config.propertyPlugins,
    },
  } as ComponentConfig<Props>;
}
