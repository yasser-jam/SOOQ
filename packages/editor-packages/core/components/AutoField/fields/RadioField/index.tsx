import { CheckCircle } from "lucide-react";
import { FieldPropsInternal } from "../..";
import { useDeepField } from "../../lib/use-deep-field";
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

export const RadioField = ({
  field,
  onChange,
  readOnly,
  id,
  name = id,
  label,
  labelIcon,
  Label: FieldLabel,
}: FieldPropsInternal) => {
  const value = useDeepField(name);

  if (field.type !== "radio" || !field.options) {
    return null;
  }

  const stringifiedValue =
    value !== undefined ? JSON.stringify({ value }) : undefined;

  return (
    <FieldLabel
      icon={labelIcon || <CheckCircle size={16} />}
      label={label || name}
      readOnly={readOnly}
      el="div"
    >
      <Tabs
        value={stringifiedValue}
        onValueChange={(val) => {
          onChange(JSON.parse(val).value);
        }}
      >
        <TabsList className="w-full">
          {field.options.map((option) => (
            <TabsTrigger
              key={option.label + option.value}
              value={JSON.stringify({ value: option.value })}
              className="flex-1"
              disabled={readOnly}
            >
              {option.label || option.value?.toString()}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </FieldLabel>
  );
};
