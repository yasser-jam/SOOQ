import type { Refund, RefundStatus, RefundStatusMeta } from "./types"

export const REFUND_STATUS_META: Record<RefundStatus, RefundStatusMeta> = {
	PENDING: { label: "قيد المعالجة", badgeVariant: "secondary" },
	COMPLETED: { label: "مكتمل", badgeVariant: "outline" },
	FAILED: { label: "فشل", badgeVariant: "destructive" },
}

export const isRefundStatus = (value: string): value is RefundStatus =>
	value === "PENDING" || value === "COMPLETED" || value === "FAILED"

export const normalizeRefundStatus = (value?: string): RefundStatus => {
	if (value && isRefundStatus(value)) return value
	return "PENDING"
}

export const normalizeRefund = (model: {
	refundId?: string
	id?: string
	orderId?: string
	provider?: string | null
	refundAmount?: number | string | null
	status?: string
	requestedByUserId?: string | null
	requestedAt?: string
}): Refund => ({
	id: model.refundId ?? model.id ?? "",
	orderId: model.orderId ?? "",
	provider: model.provider ?? null,
	refundAmount:
		typeof model.refundAmount === "string"
			? Number(model.refundAmount)
			: model.refundAmount ?? 0,
	status: normalizeRefundStatus(model.status),
	requestedByUserId: model.requestedByUserId ?? null,
	requestedAt: model.requestedAt,
})
