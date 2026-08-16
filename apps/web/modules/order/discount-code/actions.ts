import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
	CreateDiscountCodePayload,
	DiscountCode,
	DiscountCodeApiModel,
	UpdateDiscountCodeInput,
} from "./types"

const normalizeDiscountCode = (
	model: DiscountCodeApiModel
): DiscountCode => ({
	...model,
	id: model.discountCodeId ?? model.id ?? "",
})

export const listDiscountCodes = async (): Promise<DiscountCode[]> => {
	const response = await api<ApiResponse<DiscountCodeApiModel[]>>(
		"/admin/discount-codes"
	)

	return response.data?.map(normalizeDiscountCode) ?? []
}

export const getDiscountCode = async (id: string): Promise<DiscountCode> => {
	const response = await api<ApiResponse<DiscountCodeApiModel>>(
		`/admin/discount-codes/${id}`
	)

	return normalizeDiscountCode(response.data as DiscountCodeApiModel)
}

export const createDiscountCode = async (
	data: CreateDiscountCodePayload
): Promise<void> => {
	await api<ApiResponse<unknown>>("/admin/discount-codes", {
		method: "POST",
		body: { ...data, applicableScope: "ALL" },
	})
}

export const updateDiscountCode = async ({
	id,
	data,
}: UpdateDiscountCodeInput): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/discount-codes/${id}`, {
		method: "PUT",
		body: { ...data, applicableScope: "ALL" },
	})
}

export const deleteDiscountCode = async (id: string): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/discount-codes/${id}`, {
		method: "DELETE",
	})
}
