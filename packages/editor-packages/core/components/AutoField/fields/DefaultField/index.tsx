import { Hash, Type } from "lucide-react";
import { FieldPropsInternal } from "../..";
import { Input } from "@workspace/ui/components/input";
import { useLocalValue } from "../../lib/use-local-value";

export const DefaultField = ({
  field,
  onChange,
  readOnly,
  id,
  name = id,
  label,
  labelIcon,
  Label,
}: FieldPropsInternal) => {
  const [localValue, onChangeLocal] = useLocalValue(name, onChange);

  return (
    <Label
      label={label || name}
      icon={
        labelIcon || (
          <>
            {field.type === "text" && <Type size={16} />}
            {field.type === "number" && <Hash size={16} />}
          </>
        )
      }
      readOnly={readOnly}
    >
      <Input
        size="sm"
        autoComplete="off"
        type={field.type}
        title={label || name}
        name={name}
        value={localValue}
        onChange={(e) => {
          if (field.type === "number") {
            const numberValue = Number(e.currentTarget.value);

            if (typeof field.min !== "undefined" && numberValue < field.min) {
              return;
            }

            if (typeof field.max !== "undefined" && numberValue > field.max) {
              return;
            }

            onChangeLocal(numberValue);
          } else {
            onChangeLocal(e.currentTarget.value);
          }
        }}
        disabled={readOnly}
        id={id}
        min={field.type === "number" ? field.min : undefined}
        max={field.type === "number" ? field.max : undefined}
        placeholder={
          field.type === "text" || field.type === "number"
            ? field.placeholder
            : undefined
        }
        step={field.type === "number" ? field.step : undefined}
      />
    </Label>
  );
};
