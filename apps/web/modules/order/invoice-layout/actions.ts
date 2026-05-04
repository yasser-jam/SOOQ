import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
	CreateInvoiceLayoutPayload,
	InvoiceLayoutProfile,
	InvoiceLayoutProfileApiModel,
	UpdateInvoiceLayoutInput,
} from "./types"

const normalizeInvoiceLayout = (
	model: InvoiceLayoutProfileApiModel
): InvoiceLayoutProfile => ({
	id: model.profileId ?? model.id ?? "",
	profileName: model.profileName,
	visibleFieldsJson: model.visibleFieldsJson ?? null,
	isDefault: Boolean(model.isDefault),
	createdAt: model.createdAt,
})

export const listInvoiceLayouts = async (): Promise<InvoiceLayoutProfile[]> => {
	const response = await api<ApiResponse<InvoiceLayoutProfileApiModel[]>>(
		"/admin/invoice-layout-profiles"
	)

	return response.data?.map(normalizeInvoiceLayout) ?? []
}

export const getInvoiceLayout = async (
	id: string
): Promise<InvoiceLayoutProfile> => {
	const response = await api<ApiResponse<InvoiceLayoutProfileApiModel>>(
		`/admin/invoice-layout-profiles/${id}`
	)

	return normalizeInvoiceLayout(
		response.data as InvoiceLayoutProfileApiModel
	)
}

export const createInvoiceLayout = async (
	data: CreateInvoiceLayoutPayload
): Promise<void> => {
	await api<ApiResponse<unknown>>("/admin/invoice-layout-profiles", {
		method: "POST",
		body: data,
	})
}

export const updateInvoiceLayout = async ({
	id,
	data,
}: UpdateInvoiceLayoutInput): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/invoice-layout-profiles/${id}`, {
		method: "PUT",
		body: data,
	})
}

export const deleteInvoiceLayout = async (id: string): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/invoice-layout-profiles/${id}`, {
		method: "DELETE",
	})
}
