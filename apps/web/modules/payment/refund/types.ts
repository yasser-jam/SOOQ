import type { BadgeVariant } from "@/lib/domain-enums"

export type RefundStatus = "PENDING" | "COMPLETED" | "FAILED"

export interface RefundApiModel {
	refundId?: string
	id?: string
	orderId?: string
	provider?: string | null
	refundAmount?: number | string | null
	status?: string
	requestedByUserId?: string | null
	requestedAt?: string
}

export interface Refund {
	id: string
	orderId: string
	provider: string | null
	refundAmount: number
	status: RefundStatus
	requestedByUserId: string | null
	requestedAt?: string
}

export interface InitiateRefundPayload {
	orderId: string
	refundAmount: number
	reason?: string
}

export interface RefundStatusMeta {
	label: string
	badgeVariant: BadgeVariant
}
