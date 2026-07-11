# packages/ui — Shared Design System (@workspace/ui)

shadcn-style component library on Radix/Base-UI + Tailwind CSS 4 + CVA. Consumed by
`apps/web` (and available to other apps) via the `@workspace/ui/*` alias — source is imported
directly (`packages/ui/src/*`), there is no build step.

## Layout

- `src/components/` — one file per primitive: button, input, field, dialog, table, tabs,
  select, combobox, sidebar, sheet, sonner (toaster), file-upload, input-otp, …
- `src/styles/globals.css` — design tokens as CSS variables (`--primary: #122640`,
  `--secondary: #BA7B1B`, radii, etc.) + Tailwind base. Theming lives here, not in apps.
- `src/hooks/`, `src/lib/` — shared hooks and `cn()` utility.

## Rules

- Import pattern in apps: `import { Button } from "@workspace/ui/components/button"` —
  never deep-copy a primitive into an app; extend here instead.
- Components follow the shadcn idiom: forwardable, `className` merged with `cn()`,
  variants via `class-variance-authority`, `data-slot` attributes for styling hooks.
- Must work in RTL (the apps are `dir="rtl"`): prefer logical properties/`start`/`end`
  utilities over `left`/`right`.
- Form primitives (`field.tsx`) carry the accessibility contract: label `htmlFor`,
  `role="alert"` errors — keep it when adding inputs.
- App-specific composition (e.g. product tables, order cards) does NOT belong here —
  put it in the app's module `components/`. This package is primitives only.
