import { ComponentData, ComponentDataOptionalId, Config } from "../../types";
import { generateId } from "../generate-id";
import { walkTree } from "./walk-tree";

export const populateIds = (
  data: ComponentData,
  config: Config,
  override: boolean = false
): ComponentData => {
  const id = generateId(data.type);
  const rootProps = data.props as Record<string, unknown>;
  const existingRootId = rootProps.id;

  return walkTree(
    {
      ...data,
      props: override
        ? { ...data.props, id }
        : {
            ...data.props,
            id:
              typeof existingRootId === "string" && existingRootId
                ? existingRootId
                : id,
          },
    },
    config,
    (contents) =>
      contents.map((item: ComponentDataOptionalId) => {
        const childId = generateId(item.type);
        const itemProps = (item.props ?? {}) as Record<string, unknown>;
        const existingChildId = itemProps.id;

        return {
          ...item,
          props: override
            ? { ...item.props, id: childId }
            : {
                ...item.props,
                id:
                  typeof existingChildId === "string" && existingChildId
                    ? existingChildId
                    : childId,
              },
        };
      })
  );
};
