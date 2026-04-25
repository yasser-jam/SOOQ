# Refactoring Notes: Detail Pages (Create/Edit Pattern)

## Overview
This document describes the refactoring pattern applied to detail pages (create/edit dialogs) across the frontend, specifically targeting product modules. This pattern ensures consistency, maintainability, and follows clean architecture principles.

## Applied Requirements

### 1. Move Data Fetching Inside Component
- **Use `useQuery` and `useMutation` directly in the component**, not in separate hooks or actions
- Place all data fetching logic at the component level for clarity and easier debugging
- Query and mutation definitions should be straightforward and close to their usage

```typescript
// ✅ Correct
const { data: category, isLoading } = useQuery({
  queryKey: productCategoryKeys.detail(categoryId),
  queryFn: () => getProductCategory(categoryId),
  enabled: isEdit,
})

const { isPending: isUpdating, mutate: updateCategory } = useMutation({
  mutationFn: updateProductCategory,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
    router.push("/products/categories")
  },
})
```

### 2. Keep Actions as Thin Layers
- Actions should only be API call wrappers, no business logic
- Payload normalization happens in the component's `handleSubmit`, not in the action
- No over-engineering with intermediate functions

```typescript
// Actions should be simple:
// export const createProductCategory = (payload: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>) => api.post(...)
// export const updateProductCategory = (category: ProductCategory) => api.put(...)

// Component handles the transformation:
const handleSubmit = useCallback(
  (values: ProductCategory) => {
    if (isEdit) {
      updateCategory(initCategory(categoryId, initCategoryPayload(values)))
      return
    }
    createCategory(initCategoryPayload(values))
  },
  [categoryId, createCategory, isEdit, updateCategory]
)
```

### 3. Use `useEffect` Instead of `import * as React`
- Import only the hooks you need from React
- Explicit imports are clearer and help with tree-shaking

```typescript
// ✅ Correct
import { useCallback, useEffect } from "react"

useEffect(() => {
  // form reset logic
}, [dependencies])

// ❌ Avoid
import * as React from "react"
React.useEffect(...)
```

### 4. Use Field Component for Simple Inputs
- For text inputs, use the `Field` component from `@/components/system/Field`
- Avoid adding types for each field; let the Field component handle validation display
- Only use `Controller` + `Textarea` for special cases (textarea, rich editors, etc.)

```typescript
// ✅ Use Field component for text inputs
<Field
  name="nameAr"
  control={form.control}
  label="الاسم بالعربية"
  placeholder="أدخل الاسم بالعربية"
  inputProps={{ disabled: isSubmitting }}
/>

// ✅ Use Controller only for special fields
<Controller
  name="descriptionAr"
  control={form.control}
  render={({ field }) => (
    <Textarea
      {...field}
      id="descriptionAr"
      placeholder="أدخل الوصف بالعربية"
      disabled={isSubmitting}
      className="min-h-24"
    />
  )}
/>
```

## Refactored Pattern - Product Category Example

### Structure Overview

```
/modules/product/category/
├── lib/
│   └── init.ts          # Form initialization defaults
├── actions.ts           # Thin API wrappers
├── schema.ts            # Zod schema
├── types.ts             # TypeScript types
└── components/
    └── [category-id]
        └── page.tsx     # Detail page (create/edit)
```

### Key Files

#### 1. `lib/init.ts` - Centralized Initialization
```typescript
import { ProductCategory } from "../types";

export const init = (category?: ProductCategory): ProductCategory => ({
  nameAr: category?.nameAr || '',
  nameEn: category?.nameEn || '',
  slug: category?.slug || '',
  parentCategoryId: category?.parentCategoryId || null,
  sortOrder: category?.sortOrder || 0,
  descriptionAr: category?.descriptionAr || '',
  descriptionEn: category?.descriptionEn || '',
  isActive: category?.isActive ?? true,
})
```

**Benefits:**
- Single source of truth for default values
- Easy to maintain and update defaults
- Automatic null coalescing and fallbacks
- Reusable across components

#### 2. `page.tsx` - Detail Page Pattern

```typescript
"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"

import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import { init } from "@/modules/product/category/lib/init"
import { initCategory, initCategoryPayload } from "@/modules/product/category/init"
import {
  createProductCategory,
  getProductCategory,
  updateProductCategory,
  productCategoryKeys,
} from "@/modules/product/category/actions"
import { productCategorySchema } from "@/modules/product/category/schema"
import { ProductCategory } from "@/modules/product/category/types"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Textarea } from "@workspace/ui/components/textarea"

export default function EditCategoryPage() {
  // ===== State & Routing =====
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams()
  const categoryId = params?.["category-id"]?.toString() ?? ""
  const isEdit = categoryId !== "create"

  // ===== Form Setup =====
  const form = useForm({
    resolver: zodResolver(productCategorySchema),
    defaultValues: init(),
  })

  // ===== Data Fetching =====
  const { data: category, isLoading } = useQuery({
    queryKey: productCategoryKeys.detail(categoryId),
    queryFn: () => getProductCategory(categoryId),
    enabled: isEdit,
  })

  // ===== Form Population =====
  useEffect(() => {
    if (!isEdit) {
      form.reset(init())
      return
    }

    if (!category) return

    form.reset(init(category))
  }, [category, form, isEdit])

  // ===== Mutations =====
  const { isPending: isUpdating, mutate: updateCategory } = useMutation({
    mutationFn: updateProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
      router.push("/products/categories")
    },
  })

  const { isPending: isCreating, mutate: createCategory } = useMutation({
    mutationFn: createProductCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryKeys.all })
      router.push("/products/categories")
    },
  })

  // ===== Form Submission =====
  const handleSubmit = useCallback(
    (values: ProductCategory) => {
      if (isEdit) {
        if (!categoryId) return
        updateCategory(initCategory(categoryId, initCategoryPayload(values)))
        return
      }

      createCategory(initCategoryPayload(values))
    },
    [categoryId, createCategory, isEdit, updateCategory]
  )

  const isSubmitting = isUpdating || isLoading || isCreating

  // ===== Render =====
  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="sm"
      title={isEdit ? "تعديل الفئة" : "إضافة فئة"}
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        {/* Simple text inputs use Field component */}
        <Field
          name="nameAr"
          control={form.control}
          label="الاسم بالعربية"
          placeholder="أدخل الاسم بالعربية"
          inputProps={{ disabled: isSubmitting }}
        />

        {/* Complex fields use Controller */}
        <div className="md:col-span-2">
          <UiField data-invalid={Boolean(form.formState.errors.descriptionAr)}>
            <FieldLabel htmlFor="descriptionAr">الوصف بالعربية</FieldLabel>
            <Controller
              name="descriptionAr"
              control={form.control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="descriptionAr"
                  placeholder="أدخل الوصف بالعربية"
                  disabled={isSubmitting}
                  className="min-h-24"
                />
              )}
            />
            <FieldError errors={[form.formState.errors.descriptionAr]} />
          </UiField>
        </div>
      </form>
    </PageDialog>
  )
}
```

## Checklist for Applying to Other Modules

When refactoring or creating a new detail page, follow this checklist:

### Setup Phase
- [ ] Create `lib/init.ts` with centralized form defaults
- [ ] Export `init(entity?: Type): Type` function
- [ ] Use nullish coalescing (`??`) and OR (`||`) operators for defaults
- [ ] Include all form fields in defaults

### Component Phase
- [ ] Import only specific React hooks (`useCallback`, `useEffect`, etc.)
- [ ] Use `useForm` with full schema (not omitted)
- [ ] Set `defaultValues: init()`
- [ ] Define `useQuery` for fetching data (enable only on edit)
- [ ] Define separate `useMutation` for create and update

### Form Reset Logic
- [ ] In `useEffect`, check `isEdit` flag
- [ ] Reset to `init()` for create mode
- [ ] Reset to `init(data)` for edit mode
- [ ] Include dependencies: `[data, form, isEdit]`

### Form Fields
- [ ] Use `<Field>` component for text inputs
- [ ] Use `<Controller>` only for special fields (textarea, select, etc.)
- [ ] Never add type generics to `Field` component
- [ ] Pass `disabled={isSubmitting}` to all inputs

### Submission
- [ ] Use `useCallback` with proper dependencies
- [ ] Check `!categoryId` before edit operations
- [ ] Call `initCategoryPayload()` before mutation
- [ ] Let mutation handle query invalidation

### Loading States
- [ ] Define `isSubmitting = isUpdating || isLoading || isCreating`
- [ ] Pass `disabled={isSubmitting}` to submit button

## Common Patterns

### Pattern: Create vs Edit Mode
```typescript
const isEdit = entityId !== "create"

// In useQuery
const { data: entity, isLoading } = useQuery({
  queryKey: entityQueryKeys.detail(entityId),
  queryFn: () => getEntity(entityId),
  enabled: isEdit,  // Only fetch when editing
})

// In useEffect
useEffect(() => {
  if (!isEdit) {
    form.reset(init())
    return
  }
  if (!entity) return
  form.reset(init(entity))
}, [entity, form, isEdit])
```

### Pattern: Multiple Mutations
```typescript
// Create mutation
const { isPending: isCreating, mutate: createEntity } = useMutation({
  mutationFn: createProductEntity,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: entityQueryKeys.all })
    router.push("/products/entities")
  },
})

// Update mutation
const { isPending: isUpdating, mutate: updateEntity } = useMutation({
  mutationFn: updateProductEntity,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: entityQueryKeys.all })
    router.push("/products/entities")
  },
})

// Combined loading state
const isSubmitting = isUpdating || isLoading || isCreating
```

### Pattern: Form Submission Handler
```typescript
const handleSubmit = useCallback(
  (values: ProductEntity) => {
    if (isEdit) {
      if (!entityId) return
      updateEntity(initEntity(entityId, initEntityPayload(values)))
      return
    }
    createEntity(initEntityPayload(values))
  },
  [entityId, createEntity, isEdit, updateEntity]
)
```

## Benefits of This Pattern

✅ **Consistency**: Same pattern across all detail pages  
✅ **Maintainability**: Clear structure and single responsibilities  
✅ **Testability**: Easy to test components with hooks  
✅ **Performance**: useCallback prevents unnecessary re-renders  
✅ **Clarity**: No over-engineering, straightforward logic flow  
✅ **Reusability**: `init()` function can be shared  
✅ **Type Safety**: Full schema with Zod validation  

## References

- **Component**: [Field.tsx](/apps/web/components/system/Field.tsx)
- **Pattern Reference**: 
  - Tags page: [products/tags/[tag-id]/page.tsx](/apps/web/app/(dashboard)/products/tags/[tag-id]/page.tsx)
  - Categories page: [products/categories/[category-id]/page.tsx](/apps/web/app/(dashboard)/products/categories/[category-id]/page.tsx)
- **Query Keys**: Using `module/queryKeys.ts` for consistent query key generation
- **Actions**: Keep thin API wrappers only, no business logic

## Next Steps

Apply this pattern to remaining modules:
- [ ] Products
- [ ] Orders
- [ ] Collections
- [ ] Other domain modules as needed
