import { Badge } from "@workspace/ui/components/badge"

import type { BuildStatus } from "../types"

const STATUS_LABELS: Record<BuildStatus, string> = {
	QUEUED: "بانتظار البدء",
	BUILDING: "جارٍ البناء",
	SUCCESS: "تم بنجاح",
	FAILED: "فشل البناء",
	CANCELLED: "أُلغي",
	TIMEOUT: "انتهت المهلة",
}

const STATUS_VARIANTS: Record<BuildStatus, "secondary" | "primary" | "destructive"> = {
	QUEUED: "secondary",
	BUILDING: "primary",
	SUCCESS: "primary",
	FAILED: "destructive",
	CANCELLED: "destructive",
	TIMEOUT: "destructive",
}

export function BuildStatusBadge({ status }: { status: BuildStatus }) {
	return <Badge variant={STATUS_VARIANTS[status] ?? "secondary"}>{STATUS_LABELS[status] ?? status}</Badge>
}
