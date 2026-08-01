"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from "react";
import { AutoField, FieldLabel } from "../../../components/AutoField";
import { Button } from "../../../components/Button";
import { createUsePuck } from "../../../lib/use-puck";
import { walkTree } from "../../../lib/data/walk-tree";
import { ComponentConfig, ComponentDataOptionalId, Slot } from "@/core/types";
import { withLayout } from "../../components/Layout";
import { generateId } from "@/core/lib/generate-id";
import { componentKey } from "../../component-key";
import { type Components } from "../../types";
import TemplateComponent, { TemplateProps } from "./Template";
// Direct sibling imports instead of `await import("../../index")` — the
// registry imports this block, so importing the registry back was a circular
// (dynamic) import. Only the block types used by the demo templates are needed.
import { Heading as HeadingBlock } from "../Heading";
import { Text as TextBlock } from "../Text";
import { Grid as GridBlock } from "../Grid";
import { Card as CardBlock } from "../Card";
import { Flex as FlexBlock } from "../Flex";
import { Space as SpaceBlock } from "../Space";
import { Button as ButtonBlock } from "../Button";

const usePuck = createUsePuck();

const TEMPLATE_BLOCKS = {
  Heading: HeadingBlock,
  Text: TextBlock,
  Grid: GridBlock,
  Card: CardBlock,
  Flex: FlexBlock,
  Space: SpaceBlock,
  Button: ButtonBlock,
} as const;

function createComponent<T extends keyof typeof TEMPLATE_BLOCKS>(
  component: T,
  props?: Partial<Components[T]>
): ComponentDataOptionalId<Components[T]> {
  return {
    type: component,
    props: {
      ...TEMPLATE_BLOCKS[component].defaultProps,
      ...props,
    },
  } as ComponentDataOptionalId<Components[T]>;
}

type TemplateData = Record<string, { label: string; data: Slot }>;

export const TemplateInternal: ComponentConfig<TemplateProps> = {
  fields: {
    template: {
      type: "custom",
      render: ({ name, value, onChange }) => {
        const templateKey = `puck-demo-templates:${componentKey}`;

        const props = usePuck((s) => s.selectedItem?.props) as
          | TemplateProps
          | undefined;
        const config = usePuck((s) => s.config);

        const [templates, setTemplates] = useState<TemplateData>(
          JSON.parse(localStorage.getItem(templateKey) ?? "{}")
        );

        return (
          <FieldLabel label={name}>
            <AutoField
              value={value}
              onChange={onChange}
              field={{
                type: "select",
                options: [
                  { label: "Blank", value: "blank" },
                  { label: "Example 1", value: "example_1" },
                  { label: "Example 2", value: "example_2" },
                  ...Object.entries(templates).map(([key, template]) => ({
                    value: key,
                    label: template.label,
                  })),
                ],
              }}
            />
            <div style={{ marginLeft: "auto", marginTop: 16 }}>
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!props?.children) {
                    return;
                  }

                  const templateId = generateId();

                  const data = props.children.map((child) =>
                    walkTree(
                      {
                        type: child.type,
                        props: { ...child.props, id: generateId(child.type) },
                      },
                      config,
                      (content) =>
                        content.map((item) => ({
                          ...item,
                          props: { ...item.props, id: generateId(item.type) },
                        }))
                    )
                  );

                  const templateData = {
                    ...templates,
                    [templateId]: {
                      label: new Date().toLocaleString(),
                      data,
                    },
                  };

                  localStorage.setItem(
                    templateKey,
                    JSON.stringify(templateData)
                  );

                  setTemplates(templateData);

                  onChange(templateId);
                }}
              >
                Save new template
              </Button>
            </div>
          </FieldLabel>
        );
      },
    },
    children: {
      type: "slot",
    },
  },
  defaultProps: {
    template: "example_1",
    children: [],
  },
  resolveData: async (data, { changed, trigger }) => {
    if (!changed.template || trigger === "load") return data;

    const templateKey = `puck-demo-templates:${componentKey}`;

    const templates: TemplateData = {
      ...JSON.parse(localStorage.getItem(templateKey) ?? "{}"),
      blank: {
        label: "Blank",
        data: [],
      },
      example_1: {
        label: "Example 1",
        data: [
          createComponent("Heading", {
            text: "Template example.",
            size: "xl",
          }),
          createComponent("Text", {
            text: "This component uses the slots API. Try changing template, or saving a new one via the template field.",
          }),
        ],
      },
      example_2: {
        label: "Example 2",
        data: [
          createComponent("Grid", {
            numColumns: 2,
            items: [
              createComponent("Card", { title: "A card", mode: "card" }),
              createComponent("Flex", {
                direction: "column",
                gap: 0,
                items: [
                  createComponent("Space", {
                    size: "32px",
                  }),
                  createComponent("Heading", {
                    text: "Template example",
                    size: "xl",
                  }),
                  createComponent("Text", {
                    text: "Dynamically create components using the new slots API.",
                  }),
                  createComponent("Space", {
                    size: "16px",
                  }),
                  createComponent("Button", {
                    variant: "secondary",
                    label: "Learn more",
                  }),
                  createComponent("Space", {
                    size: "32px",
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    };

    const children =
      templates[data.props.template]?.data || templates["example_1"]!.data;

    return {
      ...data,
      props: {
        ...data.props,
        children,
      },
    };
  },
  render: TemplateComponent,
};

export const Template = withLayout(TemplateInternal);
