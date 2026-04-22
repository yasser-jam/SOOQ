import type {
	AdminOrder,
	AdminOrderCustomer,
	AdminOrderListItem,
	AdminOrderNote,
	AdminOrderShippingAddress,
} from "./types"

export const formatOrderDate = (value?: string | null) => {
	if (!value) return ""

	const parsedDate = new Date(value)

	if (Number.isNaN(parsedDate.getTime())) return value

	return parsedDate.toLocaleDateString("en-GB").replace(/\//g, "-")
}

export const formatOrderDateTime = (value?: string | null) => {
	if (!value) return ""

	const parsedDate = new Date(value)

	if (Number.isNaN(parsedDate.getTime())) return value

	return parsedDate.toLocaleString("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	})
}

export const formatOrderMoney = (
	amount?: number | null,
	currencyCode?: string | null
) => {
	if (typeof amount !== "number") return ""
	if (!currencyCode) return String(amount)

	try {
		return new Intl.NumberFormat("ar-SY", {
			style: "currency",
			currency: currencyCode,
			maximumFractionDigits: 0,
		}).format(amount)
	} catch {
		return `${amount} ${currencyCode}`
	}
}

const isAdminOrderCustomer = (
	value: AdminOrder | AdminOrderListItem | AdminOrderCustomer
): value is AdminOrderCustomer =>
	"name" in value || "fullName" in value || "firstName" in value

export const getOrderCustomerName = (
	value?: AdminOrder | AdminOrderListItem | AdminOrderCustomer | null
): string => {
	if (!value) return "عميل"

	if (isAdminOrderCustomer(value)) {
		return (
			value.name ??
			value.fullName ??
			[value.firstName, value.lastName].filter(Boolean).join(" ") ??
			"عميل"
		)
	}

	return (
		value.customerName ??
		getOrderCustomerName(value.customer ?? null) ??
		value.guestName ??
		"عميل"
	)
}

export const getOrderShippingAddress = (
	order?: AdminOrder | null
): AdminOrderShippingAddress | null | undefined =>
	order?.shippingAddress ?? order?.customer?.shippingAddress

export const getOrderNotesByChannel = (
	notes: AdminOrderNote[] | undefined,
	channel: AdminOrderNote["channel"]
) => notes?.filter((note) => note.channel === channel) ?? []
