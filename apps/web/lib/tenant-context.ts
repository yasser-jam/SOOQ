import cookiesConfig from "@/config/cookies-config"
import { getCookie } from "@/lib/cookies"
import { getTenantIdFromToken } from "@/lib/jwt"
import { isMockApiEnabled } from "@/lib/mock/enabled"
import { MOCK_STORE_TENANT_ID } from "@/lib/mock/seed"

/**
 * Tenant UUID for the signed-in merchant session (editor / dashboard),
 * or the storefront customer cookie (`sooq-tenant-id`).
 *
 * In mock mode, falls back to the seeded store tenant so public catalog
 * fetches work on `apps/store` before customer login.
 */
export function getEditorTenantId(): string | null {
	const token = getCookie(cookiesConfig.accessToken)
	if (token) {
		const fromToken = getTenantIdFromToken(token)
		if (fromToken) return fromToken
	}

	const fromCookie = getCookie(cookiesConfig.tenantId)
	if (fromCookie) return fromCookie

	if (isMockApiEnabled()) {
		return MOCK_STORE_TENANT_ID
	}

	return null
}
