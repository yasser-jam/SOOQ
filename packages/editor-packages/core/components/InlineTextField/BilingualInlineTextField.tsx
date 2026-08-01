"use client";

import { memo, useCallback } from "react";
import { useAppStore } from "../../store";
import { InlineTextField } from "../InlineTextField";
import {
  normalizeBilingual,
  type BilingualString,
} from "../../lib/bilingual";
import { useDisplayLanguage } from "../../config/locale/use-display-language";

type BilingualInlineTextFieldProps = {
  propPath: string;
  componentId: string;
  value: BilingualString | string | undefined;
  isReadOnly: boolean;
  opts?: { disableLineBreaks?: boolean };
};

const BilingualInlineTextFieldInternal = ({
  propPath,
  componentId,
  value,
  isReadOnly,
  opts = {},
}: BilingualInlineTextFieldProps) => {
  const rootLanguage = useAppStore(
    (s) => (s.state.data.root.props?.language as "ar" | "en" | undefined) ?? "ar"
  );
  const language = useDisplayLanguage(rootLanguage);
  const normalized = normalizeBilingual(value);
  const displayValue = normalized[language] || normalized[language === "ar" ? "en" : "ar"];

  const transformValue = useCallback(
    (_props: Record<string, unknown>, text: string): BilingualString => {
      const current = normalizeBilingual(value);
      return { ...current, [language]: text };
    },
    [language, value]
  );

  return (
    <InlineTextField
      propPath={propPath}
      componentId={componentId}
      value={displayValue}
      isReadOnly={isReadOnly}
      opts={opts}
      transformValue={transformValue}
    />
  );
};

export const BilingualInlineTextField = memo(BilingualInlineTextFieldInternal);
