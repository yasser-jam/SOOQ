import type { BadgeVariant } from "@/lib/domain-enums"

import type { DiscountScope, DiscountType } from "./types"

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
	PERCENTAGE: "نسبة مئوية",
	FIXED_AMOUNT: "مبلغ ثابت",
	FREE_SHIPPING: "شحن مجاني",
}

export const DISCOUNT_SCOPE_LABELS: Record<DiscountScope, string> = {
	ALL: "كل المنتجات",
	PRODUCT: "منتجات محددة",
	CATEGORY: "فئات محددة",
}

export type DiscountCodeStatus = "ACTIVE" | "INACTIVE" | "EXPIRED" | "SCHEDULED"

export const DISCOUNT_STATUS_META: Record<
	DiscountCodeStatus,
	{ label: string; badgeVariant: BadgeVariant }
> = {
	ACTIVE: { label: "نشط", badgeVariant: "secondary-tonal" },
	INACTIVE: { label: "غير نشط", badgeVariant: "outline" },
	SCHEDULED: { label: "مجدول", badgeVariant: "secondary" },
	EXPIRED: { label: "منتهي", badgeVariant: "destructive" },
}

export const computeDiscountCodeStatus = (
	startsAt: string,
	expiresAt: string,
	isActive: boolean,
	now: Date = new Date()
): DiscountCodeStatus => {
	if (!isActive) return "INACTIVE"

	const start = new Date(startsAt)
	const end = new Date(expiresAt)

	if (!Number.isNaN(end.getTime()) && end.getTime() < now.getTime()) {
		return "EXPIRED"
	}

	if (!Number.isNaN(start.getTime()) && start.getTime() > now.getTime()) {
		return "SCHEDULED"
	}

	return "ACTIVE"
}
