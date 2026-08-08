"use client";

import type {
  ComponentConfig,
  ComponentConfigParams,
  DefaultComponentProps,
} from "@/core/types";
import type { LeftOrExactRight } from "@/core/types/Internal";
import { ShowConditionGate } from "../components/ShowConditionGate";
import {
  DEFAULT_SHOW_CONDITION,
  showConditionField,
} from "./show-condition";

/**
 * Adds a persisted `showCondition` prop and gates the block render on
 * customer auth. Applied to every registered block so Site JSON can express
 * "show for logged-in users" (and the inverse) without per-block wiring.
 */
export function withShowCondition<
  Props extends LeftOrExactRight<
    Props,
    DefaultComponentProps,
    ComponentConfigParams
  >,
>(componentConfig: ComponentConfig<Props>): ComponentConfig<Props> {
  const OriginalRender = componentConfig.render;

  return {
    ...componentConfig,
    fields: {
      ...componentConfig.fields,
      showCondition: showConditionField,
    },
    defaultProps: {
      showCondition: DEFAULT_SHOW_CONDITION,
      ...componentConfig.defaultProps,
    } as ComponentConfig<Props>["defaultProps"],
    render: ((props: any) => (
      <ShowConditionGate
        condition={props.showCondition}
        dataCondition={props.dataCondition}
        isEditing={!!props.puck?.isEditing}
      >
        <OriginalRender {...props} />
      </ShowConditionGate>
    )) as typeof OriginalRender,
  };
}
