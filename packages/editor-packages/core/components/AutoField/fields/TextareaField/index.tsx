import { Type } from "lucide-react";
import { FieldPropsInternal } from "../..";
import { Textarea } from "@workspace/ui/components/textarea";
import { useLocalValue } from "../../lib/use-local-value";

export const TextareaField = ({
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
      icon={labelIcon || <Type size={16} />}
      readOnly={readOnly}
    >
      <Textarea
        size="sm"
        id={id}
        autoComplete="off"
        name={name}
        value={typeof localValue === "undefined" ? "" : localValue}
        onChange={(e) => onChangeLocal(e.currentTarget.value)}
        disabled={readOnly}
        placeholder={field.type === "textarea" ? field.placeholder : undefined}
      />
    </Label>
  );
};
