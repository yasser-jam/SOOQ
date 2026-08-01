import { InlineTextField } from "../../../components/InlineTextField";
import { BilingualInlineTextField } from "../../../components/InlineTextField/BilingualInlineTextField";
import { FieldTransforms } from "../../../types/API/FieldTransforms";
import { normalizeBilingual } from "../../../lib/bilingual";

const isBilingualValue = (value: unknown): boolean => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return "ar" in value || "en" in value;
  }
  return false;
};

export const getInlineTextTransform = (): FieldTransforms => ({
  text: ({ value, componentId, field, propPath, isReadOnly }) => {
    if (field.contentEditable) {
      return (
        <InlineTextField
          propPath={propPath}
          componentId={componentId}
          value={value}
          opts={{ disableLineBreaks: true }}
          isReadOnly={isReadOnly}
        />
      );
    }

    return value;
  },
  textarea: ({ value, componentId, field, propPath, isReadOnly }) => {
    if (field.contentEditable) {
      return (
        <InlineTextField
          propPath={propPath}
          componentId={componentId}
          value={value}
          isReadOnly={isReadOnly}
        />
      );
    }

    return value;
  },
  custom: ({ value, componentId, field, propPath, isReadOnly }) => {
    if (field.contentEditable && isBilingualValue(value)) {
      return (
        <BilingualInlineTextField
          propPath={propPath}
          componentId={componentId}
          value={normalizeBilingual(value as Parameters<typeof normalizeBilingual>[0])}
          isReadOnly={isReadOnly}
        />
      );
    }

    if (field.contentEditable && typeof value === "string") {
      return (
        <InlineTextField
          propPath={propPath}
          componentId={componentId}
          value={value}
          isReadOnly={isReadOnly}
        />
      );
    }

    return value;
  },
});
