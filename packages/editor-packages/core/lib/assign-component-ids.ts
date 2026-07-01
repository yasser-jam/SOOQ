import type { ComponentData, ComponentDataOptionalId, Content } from "@/core/types";

function assignNodeIds(
  node: ComponentDataOptionalId,
  id: string
): ComponentData {
  const props = { ...(node.props ?? {}), id } as Record<string, unknown>;

  for (const [key, value] of Object.entries(props)) {
    if (!Array.isArray(value)) continue;
    if (!value.every((item) => item && typeof item === "object" && "type" in item)) {
      continue;
    }

    props[key] = (value as Content).map((child, index) =>
      assignNodeIds(child as ComponentDataOptionalId, `${id}-${key}-${index}`)
    );
  }

  return {
    type: node.type,
    props,
  } as ComponentData;
}

export function assignComponentIds(
  node: ComponentDataOptionalId,
  idPrefix: string
): ComponentData {
  return assignNodeIds(node, idPrefix);
}
