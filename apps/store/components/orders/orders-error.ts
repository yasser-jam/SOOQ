/**
 * `api()` rejects with the plain object produced by `handleApiError`
 * (`{ status, message, errorCode, ... }`), not an `Error`, so unwrapping the
 * user-facing text needs both shapes.
 */
export function getOrdersErrorMessage(error: unknown, fallback: string): string {
	if (!error) return fallback

	if (typeof error === "object" && "status" in error) {
		const status = (error as { status?: number }).status
		if (status === 401 || status === 403) {
			return "انتهت صلاحية الجلسة. سجّل الدخول مرة أخرى."
		}
	}

	if (error instanceof Error && error.message) return error.message

	if (
		typeof error === "object" &&
		"message" in error &&
		typeof (error as { message: unknown }).message === "string" &&
		(error as { message: string }).message
	) {
		return (error as { message: string }).message
	}

	return fallback
}
