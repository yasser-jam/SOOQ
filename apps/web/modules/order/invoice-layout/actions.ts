import { api } from "@/lib/api"
import type { ApiResponse } from "@/lib/types"

import type {
	CreateInvoiceLayoutMutationInput,
	CreateInvoiceLayoutPayload,
	InvoiceLayoutProfile,
	InvoiceLayoutProfileApiModel,
	UpdateInvoiceLayoutMutationInput,
	UpdateInvoiceLayoutPayload,
} from "./types"

const buildMultipartBody = (
	payload: CreateInvoiceLayoutPayload | UpdateInvoiceLayoutPayload,
	logoFile?: File | null
): FormData => {
	const fd = new FormData()
	fd.append(
		"profile",
		new Blob([JSON.stringify(payload)], { type: "application/json" })
	)
	if (logoFile) fd.append("logo", logoFile)
	return fd
}

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

export const createInvoiceLayout = async ({
	payload,
	logoFile,
}: CreateInvoiceLayoutMutationInput): Promise<void> => {
	await api<ApiResponse<unknown>>("/admin/invoice-layout-profiles", {
		method: "POST",
		body: buildMultipartBody(payload, logoFile),
	})
}

export const updateInvoiceLayout = async ({
	id,
	payload,
	logoFile,
}: UpdateInvoiceLayoutMutationInput): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/invoice-layout-profiles/${id}`, {
		method: "PUT",
		body: buildMultipartBody(payload, logoFile),
	})
}

export const deleteInvoiceLayout = async (id: string): Promise<void> => {
	await api<ApiResponse<unknown>>(`/admin/invoice-layout-profiles/${id}`, {
		method: "DELETE",
	})
}
