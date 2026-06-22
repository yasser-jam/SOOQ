import { ChevronDown } from "lucide-react";
import { FieldPropsInternal } from "../..";
import { useDeepField } from "../../lib/use-deep-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

export const SelectField = ({
  field,
  onChange,
  label,
  labelIcon,
  Label,
  id,
  name = id,
  readOnly,
}: FieldPropsInternal) => {
  const value = useDeepField(name);

  if (field.type !== "select" || !field.options) {
    return null;
  }

  return (
    <Label
      label={label || name}
      icon={labelIcon || <ChevronDown size={16} />}
      readOnly={readOnly}
    >
      <Select
        value={value !== undefined ? JSON.stringify({ value }) : undefined}
        onValueChange={(val) => {
          onChange(JSON.parse(val).value);
        }}
        disabled={readOnly}
      >
        <SelectTrigger size="sm" id={id}>
          <SelectValue
            placeholder={
              field.options.find((o) => o.value === value)?.label ||
              value?.toString()
            }
          />
        </SelectTrigger>
        <SelectContent>
          {field.options.map((option) => (
            <SelectItem
              key={option.label + JSON.stringify(option.value)}
              value={JSON.stringify({ value: option.value })}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Label>
  );
};
