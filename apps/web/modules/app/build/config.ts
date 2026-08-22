import { getApiBaseUrl } from "@/lib/api"

import type { BuildStatus } from "./types"

/** "https://host/api/v1" -> "https://host" — mobile app needs the bare origin. */
export const mobileApiBaseUrl = (): string =>
	getApiBaseUrl().replace(/\/api\/v\d+$/, "")

export const IN_FLIGHT_BUILD_STATUSES: BuildStatus[] = ["QUEUED", "BUILDING"]

export const POLL_GIVE_UP_MS = 20 * 60 * 1000

/**
 * Android package segments must be lowercase alphanumeric, and no segment
 * may start with a digit. Derives a per-tenant bundle id from the store slug
 * so each merchant app can coexist on a device / on Play.
 */
export const bundleIdFor = (slug: string | null | undefined): string => {
	const sanitized = (slug ?? "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
	const segment = sanitized && !/^[0-9]/.test(sanitized) ? sanitized : `s${sanitized}`
	return `com.sooq.${segment || "merchant"}.client`
}
