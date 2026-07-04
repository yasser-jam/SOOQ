import type { ExternalField } from "@/core/types/Fields";
import {
  productExternalField,
  type ProductPickerRef,
} from "@/modules/product/product/data-store";

/**
 * Product picker for the fields panel — same `external` control used by
 * ProductCard / Group (`ExternalInput` via AutoField).
 */
export const productPickerField: ExternalField<ProductPickerRef | null> = {
  ...productExternalField,
  label: "اختر منتج",
  metadata: {
    helpText: "ابحث واختر منتجاً لربط البطاقة ببياناته الحية.",
  },
};
