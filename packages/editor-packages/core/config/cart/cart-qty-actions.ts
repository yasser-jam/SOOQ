import { resolveValueContext } from "../binding";
import { setLineQuantity } from "./store-cart";

export function bumpCartLineQuantity(
  data: unknown,
  delta: number,
  isEditing?: boolean
): boolean {
  if (isEditing || !data || typeof data !== "object") return false;

  const record = data as Record<string, unknown>;
  const lineId =
    typeof record.lineId === "string" ? record.lineId : undefined;
  if (!lineId || lineId === "demo-line") return false;

  const quantityValue = resolveValueContext("quantity", data);
  const quantity =
    typeof quantityValue === "number"
      ? quantityValue
      : Number(quantityValue) || 1;

  setLineQuantity(lineId, quantity + delta);
  return true;
}
