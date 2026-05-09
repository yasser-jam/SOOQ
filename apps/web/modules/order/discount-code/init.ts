import type {
	CreateDiscountCodeFormValues,
	DiscountCode,
	UpdateDiscountCodeInput,
	UpdateDiscountCodePayload,
} from "./types"

const toLocalDateTimeInput = (isoOrLocal?: string): string => {
	if (!isoOrLocal) return ""

	// Backend returns ISO with optional Z. <input type="datetime-local"> needs
	// "YYYY-MM-DDTHH:mm" without timezone.
	const parsed = new Date(isoOrLocal)
	if (Number.isNaN(parsed.getTime())) return ""

	const pad = (n: number) => String(n).padStart(2, "0")
	return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(
		parsed.getDate()
	)}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

export const discountCodeFormDefaults: CreateDiscountCodeFormValues = {
	code: "",
	discountType: "PERCENTAGE",
	discountValue: undefined as unknown as number,
	minOrderAmount: null,
	maxDiscountCap: null,
	usageLimit: null,
	perCustomerMax: null,
	applicableScope: "ALL",
	startsAt: "",
	expiresAt: "",
}

export const initDiscountCodeFormValues = (
	model?: DiscountCode | null
): CreateDiscountCodeFormValues => {
	if (!model) {
		return { ...discountCodeFormDefaults }
	}

	return {
		code: model.code,
		discountType: model.discountType,
		discountValue: model.discountValue,
		minOrderAmount: model.minOrderAmount ?? null,
		maxDiscountCap: model.maxDiscountCap ?? null,
		usageLimit: model.usageLimit ?? null,
		perCustomerMax: model.perCustomerMax ?? null,
		applicableScope: model.applicableScope ?? "ALL",
		startsAt: toLocalDateTimeInput(model.startsAt),
		expiresAt: toLocalDateTimeInput(model.expiresAt),
	}
}

export const initDiscountCodeUpdate = (
	id: string,
	data: UpdateDiscountCodePayload
): UpdateDiscountCodeInput => ({
	id,
	data,
})
