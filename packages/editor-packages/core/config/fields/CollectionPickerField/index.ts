import type { ExternalField } from "@/core/types/Fields";
import {
  collectionExternalField,
  type CollectionPickerRef,
} from "@/modules/product/collection/data-store";

/**
 * Collection picker for products-grid sections — same `external` control as
 * product selection (`ExternalInput` via AutoField).
 */
export const sectionCollectionPickerField: ExternalField<CollectionPickerRef | null> = {
  ...collectionExternalField,
  label: "اختر مجموعة",
  metadata: {
    preset: "products-grid",
    helpText:
      "ابحث واختر مجموعة. يتم تحميل بطاقات المنتجات (مجموعات) تلقائياً في هذا القسم.",
  },
};

/** @deprecated Use sectionCollectionPickerField */
export const collectionPickerField = sectionCollectionPickerField;
