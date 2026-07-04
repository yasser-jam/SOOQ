import cookiesConfig from "@/config/cookies-config"
import { getCookie } from "@/lib/cookies"
import { getTenantIdFromToken } from "@/lib/jwt"

/** Tenant UUID for the signed-in merchant session (editor / dashboard). */
export function getEditorTenantId(): string | null {
	const token = getCookie(cookiesConfig.accessToken)
	if (token) {
		const fromToken = getTenantIdFromToken(token)
		if (fromToken) return fromToken
	}

	const fromCookie = getCookie(cookiesConfig.tenantId)
	return fromCookie || null
}
