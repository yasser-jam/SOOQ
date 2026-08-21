/**
 * `crypto.randomUUID` only exists in secure contexts (HTTPS or localhost), so
 * plain-HTTP dev hosts — e.g. http://localtest.me:3000, which local dev uses to
 * get gateway redirects past Paymera's WAF — throw "crypto.randomUUID is not a
 * function". `crypto.getRandomValues` carries no such restriction, so fall back
 * to assembling an RFC 4122 v4 UUID from raw random bytes.
 */
export function randomUuid(): string {
	if (typeof crypto.randomUUID === "function") {
		return crypto.randomUUID()
	}

	const bytes = crypto.getRandomValues(new Uint8Array(16))
	bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
	bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
	return [
		hex.slice(0, 4).join(""),
		hex.slice(4, 6).join(""),
		hex.slice(6, 8).join(""),
		hex.slice(8, 10).join(""),
		hex.slice(10).join(""),
	].join("-")
}
