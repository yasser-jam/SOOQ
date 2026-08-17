"use client"

/**
 * StoreProvider — mounts once at the storefront root.
 *
 * This used to be a hand-maintained twin of the copy in `apps/web`. The two
 * drifted: this one never gained the orders slice, so it stopped satisfying
 * `StoreContextValue`, and it imported `@/lib/customer-account-api`, which in
 * this app aliases to `apps/web/lib/` where no such file exists.
 *
 * Since `@/modules/*` already aliases to `apps/web/modules/*` (see tsconfig),
 * the web copy resolves cleanly from here — so there is now one implementation
 * instead of two. Edit it at
 * `apps/web/modules/storefront/components/StoreProvider.tsx`.
 */

export { StoreProvider } from "@/modules/storefront/components/StoreProvider"
