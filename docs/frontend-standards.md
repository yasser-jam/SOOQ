# Frontend Standards (Inferred From This Repository)

Last analyzed: 2026-04-20
Scope: `apps/web` and `packages/ui`

## Reality Check

This codebase has a strong architectural intent (domain modules + shared UI package), but it is **not fully consistent yet**. The standards below describe what is actually happening in the repository today.

## Established Conventions

### 1) [Folder structure] Domain-first module layout under `apps/web/modules`
- Rule: Business features are grouped by domain (`product/category`, `product/tag`, `product/collection`, `product/product`) and each domain repeats the same file set (`actions`, `data`, `init`, `schema`, `types`, `components/table`).
- Why it exists: It keeps data operations, validation, and UI close to domain ownership and avoids random global utility sprawl.
- Example:

```text
apps/web/modules/product/category/
  actions.ts
  data.ts
  init.ts
  schema.ts
  types.ts
  components/table.tsx
```

### 2) [Component patterns] Shared design system is consumed via `@workspace/ui`
- Rule: App code imports primitives from `@workspace/ui/components/*` rather than redefining base controls.
- Why it exists: Consistent visual language and behavior across app screens.
- Example (`apps/web/app/(dashboard)/products/page.tsx`):

```tsx
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Field, FieldContent, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
```

### 3) [Typing conventions] Zod schema is the main type source
- Rule: Domain types are inferred from zod schemas (`z.infer`, `z.input`, `z.output`) instead of hand-written interfaces.
- Why it exists: Runtime validation and TypeScript types stay aligned.
- Example (`apps/web/modules/product/category/types.ts`):

```ts
import { productCategorySchema } from "./schema"
export type ProductCategory = z.infer<typeof productCategorySchema>
```

### 4) [State and data-fetching] React Query keys and query options live in module actions
- Rule: Each domain action file defines structured query keys and reusable `queryOptions` factories.
- Why it exists: Cache behavior is centralized and repeated query config is reduced.
- Example (`apps/web/modules/product/product/actions.ts`):

```ts
export const productKeys = {
  all: ["products"] as const,
  detail: (id: string) => [...productKeys.all, id] as const,
}

export const listProductsQueryOptions = () =>
  queryOptions({ queryKey: productKeys.all, queryFn: listProducts })
```

### 5) [Component patterns + forms] RHF + zodResolver + shared `Field` wrapper is the default form stack
- Rule: Forms typically use `react-hook-form`, `zodResolver`, and the app-level `Field` adapter for labeled inputs and errors.
- Why it exists: Reusable form structure and lower boilerplate for common controls.
- Example (`apps/web/components/system/Field.tsx`):

```tsx
<Controller
  name={name}
  control={control}
  render={({ field, fieldState }) => (
    <UiField data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <Input {...field} id={fieldId} />
      <FieldError errors={[fieldState.error]} />
    </UiField>
  )}
/>
```

### 6) [Styling approach] Utility-first CSS plus shared design tokens
- Rule: Styling is mostly Tailwind utilities over shared tokenized CSS variables in `packages/ui/src/styles/globals.css`, with a small app SCSS layer.
- Why it exists: Centralized theming with fast local layout composition.
- Example:

```scss
// apps/web/styles/style.scss
.container { @apply max-w-7xl md:max-w-none mx-auto px-4; }

// packages/ui/src/styles/globals.css
--primary: #122640;
--secondary: #BA7B1B;
```

### 7) [Accessibility expectations] Semantic form labeling is commonly present
- Rule: Inputs are usually linked to labels, and error text uses alert semantics via shared field primitives.
- Why it exists: Better screen-reader support and clearer validation UX.
- Example (`packages/ui/src/components/field.tsx`):

```tsx
<Label htmlFor="...">...</Label>
...
<div role="alert" data-slot="field-error">...</div>
```

### 8) [Localization + layout] App defaults to Arabic + RTL
- Rule: Root layout sets Arabic language and RTL direction globally.
- Why it exists: Product is Arabic-first.
- Example (`apps/web/app/layout.tsx`):

```tsx
<html lang="ar" dir="rtl" className={fontSans.variable}>
```

## Common But Inconsistent Patterns

### 1) [Folder structure + routing] Thin list routes exist, but edit routes are heavy
- Rule (current tendency): List pages mostly compose module UI; detail/create pages often hold form orchestration, validation wiring, and mutation logic directly.
- Why this likely exists: Faster feature delivery, but it weakens the "thin routes" architecture goal.
- Example:

```tsx
// thin: apps/web/app/(dashboard)/products/categories/page.tsx
<ProductCategoryTable />

// heavy: apps/web/app/(dashboard)/products/categories/[category-id]/page.tsx
// contains useForm + useQuery + useMutation + normalization + submit logic
```

### 2) [State and data-fetching] Query client lifecycle is inconsistent
- Rule (current tendency): Some providers create stable `QueryClient` instances, others re-create a new client on every render.
- Why this likely exists: Different authors used different setup patterns.
- Example:

```tsx
// stable: apps/web/components/onboarding/onboarding-query-provider.tsx
const [queryClient] = useState(() => new QueryClient())

// unstable: apps/web/components/Providers.tsx
const queryClient = new QueryClient()
```

### 3) [Naming conventions] Mixed file naming styles
- Rule (current tendency): Most files use kebab-case, but several app files use PascalCase.
- Why this likely exists: No enforced naming convention in lint/tooling.
- Example:

```text
apps/web/components/system/filter-menu.tsx
apps/web/components/system/Field.tsx
apps/web/components/Providers.tsx
apps/web/components/layout/LayoutHeader.tsx
```

### 4) [Typing conventions] zod-derived typing is strong in domains, looser in shared utils
- Rule (current tendency): Domain layer uses strict zod types; some utilities still use broad types like `any`.
- Why this likely exists: Incremental migration; domain code got stricter first.
- Example (`apps/web/lib/api.ts`):

```ts
const handleError = (error: AxiosError<any>) => {
```

### 5) [Hook patterns] App-level custom hooks are mostly absent
- Rule (current tendency): Repeated component logic is usually kept inline (local state/effects) rather than extracted to app hooks.
- Why this likely exists: Simpler local development, but duplication grows.
- Example:

```text
apps/web/hooks/.gitkeep   (no app hooks currently)

Repeated pagination logic appears in:
- modules/product/category/components/table.tsx
- modules/product/tag/components/table.tsx
- modules/product/collection/components/table.tsx
- modules/product/product/components/table.tsx
```

### 6) [Styling approach] Semantic tokens and raw utility color classes are mixed
- Rule (current tendency): Many components use semantic tokens (`text-muted-foreground`, `bg-primary`), while others use direct gray classes.
- Why this likely exists: Mixed contribution styles and legacy snippets.
- Example:

```tsx
// semantic tokens
<span className="text-muted-foreground" />

// raw utility colors
<ShoppingCart size={100} className="text-gray-400 opacity-50" />
```

### 7) [Component + navigation patterns] Navigation primitives are mixed
- Rule (current tendency): Routing often uses `router.push`, but sidebar links use plain anchors.
- Why this likely exists: Shared UI package is framework-agnostic, while app code is Next.js specific.
- Example:

```tsx
// packages/ui/src/components/app-sidebar.tsx
<a href={item.url}>...</a>
```

### 8) [Merge request expectations] Quality scripts exist but are not enforced by automation
- Rule (current tendency): `lint`, `typecheck`, and `build` scripts are available via Turbo, but repo has no CI workflow or commit gating.
- Why this likely exists: Tooling setup is ahead of process enforcement.
- Example:

```json
// package.json
"scripts": {
  "build": "turbo build",
  "lint": "turbo lint",
  "typecheck": "turbo typecheck"
}
```

## Anti-Patterns Observed

### 1) [State/auth correctness] Async cookie helpers are used synchronously
- Observation: Cookie functions are declared `async`, but call sites use them as synchronous values.
- Risk: Wrong auth header values (for example, `Bearer [object Promise]`) and unreliable token handling.
- Example:

```ts
// apps/web/lib/cookies.ts
export const getCookie = async (name: string) => { ... }

// apps/web/lib/api.ts
const token = getCookie('sooq-access-token')
config.headers.Authorization = `Bearer ${token}`
```

### 2) [State and data-fetching] Query cache can be reset by provider re-renders
- Observation: Some providers instantiate `new QueryClient()` in render scope.
- Risk: Unexpected cache churn and extra refetches.
- Example:

```tsx
// apps/web/app/(auth)/layout.tsx
const queryClient = new QueryClient()
```

### 3) [Performance architecture] Client component usage is very high
- Observation: Most feature pages are marked `"use client"`, including list/detail CRUD screens.
- Risk: Larger client bundles and less server-first rendering leverage.
- Example:

```text
"use client" appears in 34 frontend files under apps/web/**/*.tsx.
```

### 4) [Accessibility] Custom radiogroup semantics are incomplete
- Observation: Category selection uses `role="radiogroup"` on container, but children are `Button`s without radio role/state semantics.
- Risk: Screen-reader users may not get correct selected-state announcements.
- Example (`apps/web/components/onboarding/steps/category-step.tsx`):

```tsx
<div role="radiogroup" aria-label="تصنيف المتجر">
  <Button ...>...</Button>
</div>
```

### 5) [Accessibility] Dialog content without explicit dialog title primitive
- Observation: `ConfirmAlert` renders `DialogContent` + `AlertTitle` but no `DialogTitle`.
- Risk: Potential accessibility warning/announcement issues depending on Radix expectations.
- Example (`apps/web/components/system/confirm-alert.tsx`):

```tsx
<DialogContent>
  <Alert>
    <AlertTitle>...</AlertTitle>
  </Alert>
</DialogContent>
```

### 6) [Navigation/performance] Shared sidebar uses plain anchors in a Next.js app
- Observation: `app-sidebar` links are `<a href>`.
- Risk: Full document navigation instead of framework-optimized transitions/prefetch behavior.
- Example (`packages/ui/src/components/app-sidebar.tsx`):

```tsx
<a href={item.url}>...</a>
```

### 7) [Code quality] Lint config is warning-oriented
- Observation: Shared lint config uses `eslint-plugin-only-warn`.
- Risk: Important issues may never block merges.
- Example (`packages/eslint-config/base.js`):

```js
plugins: { onlyWarn }
```

### 8) [Test conventions] No frontend test suite is present
- Observation: No `*.test.*`, `*.spec.*`, or test-runner setup found.
- Risk: Regression risk is shifted to manual QA and reviewer diligence.
- Example:

```text
No matches for:
- **/*.{test,spec}.{ts,tsx,js,jsx}
- vitest|jest|playwright|cypress
```

## Needs Team Decision

These are the highest-value decisions to standardize next:

1. [Folder structure + component boundaries] Should edit/create route pages stay logic-heavy, or must business/form orchestration move into module-level UI/application files?
2. [Hook patterns] Do we introduce app-level custom hooks (for pagination, form reset from query data, mutation wiring) to remove repeated `useEffect`/`useMemo` blocks?
3. [Naming conventions] Do we enforce one file casing rule (all kebab-case vs allowed PascalCase for React components)?
4. [Typing conventions] Is `any` allowed in shared utilities (`AxiosError<any>`), or should shared code also be schema-first and strict?
5. [State/data-fetching] Must all domain API operations go through module `actions.ts`, including auth/onboarding flows, instead of inline page-level `useMutation` API calls?
6. [Styling approach] What is the boundary between tokenized semantic styles and raw color utilities (for example `text-gray-400`)?
7. [Test conventions] What minimum test bar is required per merge request (domain unit tests, route smoke tests, auth/onboarding happy paths)?
8. [Accessibility expectations] Should there be a required a11y checklist (dialog title requirement, radiogroup semantics, keyboard paths, ARIA validation)?
9. [Performance expectations] Should team policy require stable `QueryClient`, server-first pages by default, and an explicit image/navigation policy (`next/image` and no plain `<a href>` for internal app routes)?
10. [Merge request expectations] Which checks are mandatory before merge (`pnpm lint`, `pnpm typecheck`, `pnpm build`, tests), and should warning-only linting be upgraded to failing errors?
