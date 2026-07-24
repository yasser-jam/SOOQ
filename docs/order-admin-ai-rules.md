# Order Admin Module Rules

This document defines the rules future AI agents should follow when adding or binding `Order` admin APIs and pages.

## Environment Status

**IMPORTANT**: This project is NOT in production. This is a development environment.
- Database operations (DELETE, DROP, TRUNCATE, etc.) are safe to use
- Data can be freely modified, added, or deleted without fear of data loss
- No production data exists in this environment

**مهم**: هذا المشروع ليس في بيئة الإنتاج. هذه بيئة تطوير.
- عمليات قاعدة البيانات (حذف، إسقاط، تفريغ، إلخ) آمنة للاستخدام
- يمكن تعديل البيانات وإضافتها أو حذفها بحرية دون الخوف من فقدان البيانات
- لا توجد بيانات إنتاج في هذه البيئة

## Goal

Keep the `Order` module consistent with the lightweight style already used in simple modules like `Product Tag`.

The target style is:

- API interfaces live in `types.ts`
- API methods live in `actions.ts`
- query keys live in `queryKeys.ts`
- small payload helpers live in `init.ts`
- shared formatting helpers live in `utils.ts`
- `model.ts` stays UI-only
- pages bind directly to API data with `useQuery` and `useMutation`
- avoid heavy mapping layers and avoid unnecessary abstractions

## Source Of Truth

Always treat [21-4.json](/home/yasser-jamal-al-deen/graduation-project/project/SOOQ/21-4.json) as the source of truth for `Order` admin APIs.

Before adding or editing anything:

1. Read the `ORD (Order)` section.
2. Focus on `Admin - Orders`.
3. Make sure every documented admin endpoint has matching interfaces and actions.
4. Check whether an existing page already covers that endpoint.
5. If no page exists for an important admin action, create one.

## File Responsibilities

### `types.ts`

Put all API-facing interfaces here.

Rules:

- Add interfaces for every admin order endpoint request and response shape.
- Use names that reflect the API, such as:
  - `AdminOrder`
  - `AdminOrderListItem`
  - `AdminOrdersSummary`
  - `AdminOrderTimelineEvent`
  - `TransitionOrderStatusPayload`
  - `TransitionOrderStatusInput`
  - `CancelOrderPayload`
  - `UpdateOrderNotesPayload`
  - `EditOrderPayload`
- Mutation input shape should follow the existing project pattern:
  - `{ id, data }`
- Keep types close to the API payloads.
- Do not convert API fields to UI-only names inside `types.ts`.

### `actions.ts`

Keep `actions.ts` simple.

Rules:

- Use the shared `api` helper from `@/lib/api`.
- Use `ApiResponse<T>` from `@/lib/types`.
- Export plain async methods only.
- Do not add `queryOptions` helpers here.
- Do not add React hooks here.
- Do not import UI models from `model.ts`.
- Do not build a large normalization layer here.
- Return API-shaped data as much as possible.

Expected style:

```ts
export const getSomething = async (id: string): Promise<Something> => {
  const response = await api<ApiResponse<Something>>(`/path/${id}`)
  return response.data as Something
}

export const updateSomething = ({
  id,
  data,
}: UpdateSomethingInput): Promise<void> =>
  api<void>(`/path/${id}`, {
    method: "PUT",
    body: data,
  })
```

### `queryKeys.ts`

Rules:

- Keep query keys small and explicit.
- Use one shared object such as `orderQueryKeys`.
- Include keys for:
  - summary
  - list
  - detail
  - timeline

### `init.ts`

Rules:

- Only add tiny wrappers that build mutation payloads.
- Follow the same pattern used in simpler modules.
- Example:

```ts
export const initOrderCancel = (
  id: string,
  data: CancelOrderPayload
): CancelOrderInput => ({
  id,
  data,
})
```

### `utils.ts`

Rules:

- Put only tiny shared helpers here.
- Good examples:
  - date formatting
  - money formatting
  - reading customer name
  - reading shipping address
  - filtering notes by channel
- Keep them small, predictable, and reusable.
- Do not move business logic here unless it is repeated.

### `model.ts`

Rules:

- Keep `model.ts` UI-only.
- Use it for route param types and static UI metadata only.
- Do not place API binding logic in `model.ts`.
- Do not put response normalization helpers in `model.ts`.

Current acceptable usage:

- route param interfaces
- `ORDER_LIST_STATUS_META`

## Binding Rules

When binding order pages to data, follow these rules:

1. Fetch raw API data with `useQuery`.
2. Use the data directly in the page or component.
3. Read API fields directly where possible.
4. If a field needs fallback logic, use a tiny helper from `utils.ts`.
5. Avoid creating separate "view model" interfaces unless absolutely necessary.
6. Avoid a full "normalize response" function unless the same mapping is repeated in many places.

Good:

- `order?.customer?.phone`
- `order?.pricing?.subtotal`
- `formatOrderMoney(order?.pricing?.total, order?.currencyCode)`

Avoid:

- large `bindOrderDetailsModel(...)`
- large `normalizeOrder(...)`
- duplicated custom model trees just for one page

## Page Creation Rules

If an admin API represents a clear admin action and no page exists yet, create a page for it.

For this module, that means route pages like:

- `/store/[storeSlug]/orders/[order_id]/transition`
- `/store/[storeSlug]/orders/[order_id]/cancel`
- `/store/[storeSlug]/orders/[order_id]/edit`

Rules:

- Prefer route-based pages over hidden local dialogs when the action is important.
- The page should use the same visual language as the current dashboard:
  - `container`
  - `page-title`
  - rounded cards
  - `PageDialog` for focused actions
- Keep actions obvious and task-specific.
- Use the order id from route params.
- After successful mutation:
  - invalidate relevant order queries
  - navigate back to `/orders/[order_id]` or the list page

## Existing Page Binding Rules

### Orders list page

Rules:

- Bind the summary cards to `GET /admin/orders/summary`.
- Bind the table to `GET /admin/orders`.
- Use pagination values from the API when available.
- For returns tab, pass `status: "RETURN_REQUESTED"` to the list action.

### Order details page

Rules:

- Bind main order details to `GET /admin/orders/{order_id}`.
- Bind audit timeline to `GET /admin/orders/{order_id}/timeline`.
- Bind notes save action to `PUT /admin/orders/{order_id}/notes`.
- Keep customer, pricing, and items rendering directly connected to the API response.

### Action pages

Rules:

- Transition page uses `POST /transition`
- Cancel page uses `POST /cancel`
- Edit page uses `PUT /edit`

Each page should:

- fetch current order details if needed
- collect only the fields required by that endpoint
- submit using `{ id, data }`

## Design Rules

When creating new order pages or action screens:

- Match the visual tone already used in the dashboard.
- List pages follow the products header: `page-title` + `FilterMenu` + system
  `Button` (`variant="secondary"`). Never raw `<button>` or hex-styled CTAs.
  Full list/form UI rules: `.github/instructions/admin-form-ui.instructions.md`.
- Use `PageDialog` for focused edit/cancel/transition flows.
- Keep forms short and direct.
- Use `Button` variants consistently:
  - `outline` for secondary actions
  - `secondary` for primary confirmation
- Prefer cards, borders, muted surfaces, and compact layouts over overly complex layouts.
- Do not introduce a new design language for one page.
- Tables should pass `EmptyState` to `DataTable` instead of custom empty cards.

## Mutation Rules

For all order mutations:

- Use `useMutation`
- Invalidate `orderQueryKeys.all` or the specific relevant query keys
- Redirect after success
- Disable submit buttons while pending
- Keep mutation payload creation inside `init.ts`

## Cleanup Rules

When replacing an old approach:

- Remove unused mock flows if they are no longer part of the active pattern.
- Remove old dialogs if route-based pages replace them.
- Do not keep two competing implementations unless both are intentionally used.

## Verification Rules

After changes:

1. Run typecheck.
2. Fix any order-module TypeScript errors.
3. If unrelated pre-existing errors remain in other modules, report them clearly.

## Summary

Future agents should optimize for:

- simple interfaces
- simple actions
- direct binding
- minimal helpers
- route-based admin pages for important actions
- consistency with existing module patterns

If unsure, prefer the simpler approach.
