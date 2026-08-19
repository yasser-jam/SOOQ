export const STORE_FIXED_THEME_ID = "test" as const
export const STORE_HOME_PATH = "/"

export const MARKETING_SITE_URL =
	process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://ertqaa-web.vercel.app/"

/** Published-store URLs are keyed by store slug, e.g. `/store/rawaq`. */
export function buildStoreBasePath(storeSlug: string): string {
	return `/store/${storeSlug}`
}
