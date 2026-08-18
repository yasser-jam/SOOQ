export const STORE_FIXED_THEME_ID = "test" as const
export const STORE_HOME_PATH = "/"

export const MARKETING_SITE_URL =
	process.env.NEXT_PUBLIC_MARKETING_URL ?? "https://ertqaa.vercel.app/"

export const TENANT_UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidTenantId(value: string): boolean {
	return TENANT_UUID_REGEX.test(value)
}

export function buildStoreBasePath(tenantId: string): string {
	return `/store/${tenantId}`
}
