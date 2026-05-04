import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import { normalizeRefund } from "./model"
import type { InitiateRefundPayload, Refund, RefundApiModel } from "./types"

export const listRefunds = async (): Promise<Refund[]> => {
	const response = await api<ApiResponse<RefundApiModel[]>>("/admin/refunds")

	return response.data?.map(normalizeRefund) ?? []
}

export const getRefundForOrder = async (
	orderId: string
): Promise<Refund | null> => {
	try {
		const response = await api<ApiResponse<RefundApiModel>>(
			`/admin/refunds/order/${orderId}`
		)

		if (!response.data) return null

		return normalizeRefund(response.data)
	} catch (error) {
		const status = (error as { status?: number })?.status

		if (status === 404) return null

		throw error
	}
}

export const initiateRefund = async (
	payload: InitiateRefundPayload
): Promise<Refund> => {
	const response = await api<ApiResponse<RefundApiModel>>("/admin/refunds", {
		method: "POST",
		body: payload,
	})

	return normalizeRefund(response.data ?? {})
}
