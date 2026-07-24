---
description: Apply when building or editing admin forms, detail/create pages, date pickers, or dashboard UI styling in apps/web.
applyTo: "apps/web/**/*.{ts,tsx},packages/ui/src/components/**/*.{ts,tsx}"
---

# Admin Form & UI Styling Rules

Use these instructions when generating, refactoring, or reviewing forms and detail pages in `apps/web` (especially create/edit dialogs under `app/store/[storeSlug]/(dashboard)/**`).

## Core Goal

Keep forms consistent with the design system: system field adapters, semantic color tokens, shadcn composition for pickers, token-based spacing, and grid-first layouts. Do not reintroduce one-off styling or third-party date pickers.

## Required Rules

1. Use the system `Field` adapter for text/number inputs — do not import `Field as UiField` from `@workspace/ui` in page files.
2. Use design tokens / semantic Tailwind classes — never hardcode hex colors or inline `style={{ color/backgroundColor }}` for brand colors.
3. Compose date/time pickers from shadcn `Popover` + `Calendar` (or the system `DatePickerField`) — do not use `react-datepicker` / `react-date-picker`.
4. Avoid arbitrary spacing hacks (e.g. `min-h-[16px]` empty spacers) — use spacing tokens only when needed; do not invent empty space to “align” columns.
5. Prefer CSS Grid as the main form layout (`grid grid-cols-1 gap-* md:grid-cols-2`), not stacked `space-y-*` wrappers that fight the grid.

## Detailed Guidance

### 1) System Field, Not Shared `UiField` on Pages

- Import form inputs from `@/components/system/Field` (and related system adapters: `DatePickerField`, `PhoneField`, textarea, switch, etc.).
- System components already wrap `@workspace/ui` `Field` / `FieldLabel` / `FieldError` internally — pages must not re-wrap with `Field as UiField`.
- For controls that system `Field` does not cover (e.g. `Select`), use `Controller` + `FieldLabel` + `FieldError` only. Do not alias shared `Field` as `UiField` in the page.
- Always pass a real `label` to system `Field`. Do not use `label=""` and a separate manual `<label>`.

```tsx
// ✅
import Field from "@/components/system/Field"
import DatePickerField from "@/components/system/date-picker"
import { FieldError, FieldLabel } from "@workspace/ui/components/field"

<Field name="code" control={form.control} label="الرمز" inputProps={{ disabled }} />

// ✅ Select (no UiField wrapper)
<FieldLabel>النطاق</FieldLabel>
<Controller name="applicableScope" control={form.control} render={...} />
<FieldError errors={[form.formState.errors.applicableScope]} />

// ❌
import { Field as UiField } from "@workspace/ui/components/field"
<UiField>...</UiField>
<Field name="discountValue" control={form.control} label="" />
```

### 2) Design Tokens Instead of Hardcoded Colors

Map brand colors to existing tokens from `packages/ui` (`globals.css`):

| Avoid | Use |
|---|---|
| `#122640` / `style={{ color: "#122640" }}` | `text-primary` or `text-foreground` |
| `#BA7B1B` / `style={{ backgroundColor: "#BA7B1B" }}` | `variant="secondary"` on `Button`, or `bg-secondary` / `text-secondary` |
| `#E5E7EB` borders | `border-border` |
| `text-gray-500` / `text-gray-400` | `text-muted-foreground` |
| `text-red-500` | `text-destructive` |
| `border-gray-300` / focus `#BA7B1B` | default Input/Select styles (already tokenized) |

- Prefer component variants (`Button variant="secondary"`) over custom className color overrides.
- Do not add inline `style` for theme colors.

### 3) shadcn Date Picker Composition

- Date picking is **Popover + Calendar** (see [shadcn Date Picker](https://ui.shadcn.com/docs/components/base/date-picker)). There is no separate `DatePicker` root in shadcn.
- Prefer `@/components/system/date-picker` (`DatePickerField`) for react-hook-form fields that store local datetime strings (`YYYY-MM-DDTHH:mm`).
- Calendar lives in `@workspace/ui/components/calendar`. Reuse it; do not paste a one-off calendar into a page.
- **Forbidden:** `react-datepicker`, `react-date-picker`, and their CSS imports (`react-datepicker/dist/react-datepicker.css`).
- Keep datetime values in local form shape via existing module `init.ts` helpers — do not switch to UTC `toISOString().slice(...)` unless the schema explicitly requires it.

```tsx
// ✅
import DatePickerField from "@/components/system/date-picker"

<DatePickerField
  name="startsAt"
  control={form.control}
  label="تاريخ البداية"
  disabled={isSubmitting}
/>

// ❌
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
```

### 4) Spacing Tokens — No Empty Spacers

- Do not reserve invisible space with empty elements or arbitrary min-heights:
  - ❌ `<div className="min-h-[16px]" />`
  - ❌ `min-h-[16px]` on helper text “so columns align”
- Show helper / description text only when it has real content (`text-xs text-muted-foreground`).
- Prefer standard gaps: `gap-4`, `gap-6`, `gap-8` on flex/grid containers.
- Avoid `space-y-*` / `space-x-*` when `flex` + `gap-*` or `grid` + `gap-*` is enough (project preference).

### 5) Grid as Main Form Layout

- Structure create/edit forms as grids, not only vertical stacks of full-width blocks.
- Typical pattern:

```tsx
<form className="flex flex-col gap-8" onSubmit={...}>
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
    {/* fields; use md:col-span-2 for full-width rows */}
  </div>

  <div className="flex flex-col gap-6">
    <h3 className="text-xl font-bold text-primary">...</h3>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* related fields */}
    </div>
  </div>
</form>
```

- Section headings use tokenized text (`text-primary`), not inline hex colors.
- Grouped date ranges may sit in a bordered panel (`rounded-lg border border-border p-6`) that itself contains a grid.

## PR Review Expectations

Flag changes that:

- import `Field as UiField` (or use shared `Field` as the page-level form adapter)
- hardcode hex brand colors or inline color/background styles
- add `react-datepicker` / `react-date-picker` (or their CSS)
- insert empty spacer divs / `min-h-[…]` alignment hacks
- replace an existing grid form layout with ad-hoc stacked blocks without a reason
- leave inputs with empty `label=""` plus a duplicate manual label

## Related Sources

- System field adapters: `apps/web/components/system/Field.tsx`, `date-picker.tsx`
- Design tokens: `packages/ui/src/styles/globals.css`
- Detail-page pattern: `docs/refactoring-notes-detail-pages.md`
- Frontend conventions: `docs/frontend-standards.md`
- shadcn Date Picker: https://ui.shadcn.com/docs/components/base/date-picker
