"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { clearCart } from "@/core/config/cart/store-cart"
import { getOrderPaymentStatus } from "@/modules/storefront/components/checkout/checkout-api"

import { useStoreTenant } from "../../lib/store-tenant-context"
import { OrdersMessage } from "../orders/orders-states"

/** Keep polling a PENDING payment for at most three minutes. */
const POLL_INTERVAL_MS = 4_000
const POLL_DEADLINE_MS = 3 * 60_000

/**
 * Landing page for the gateway redirect (Paymera callbackURL). The backend
 * appends `orderId` to the return URL at payment-initiation time; this view
 * polls `GET /public/payments/order/{orderId}/status` — which re-checks the
 * gateway server-side — until the payment settles, then clears the cart on
 * success.
 */
export function PaymentResultView() {
	const { tenantId, basePath } = useStoreTenant()
	const searchParams = useSearchParams()
	const orderId = searchParams.get("orderId")?.trim() || null

	const deadlineRef = useRef<number | null>(null)
	if (deadlineRef.current === null) {
		deadlineRef.current = Date.now() + POLL_DEADLINE_MS
	}

	const { data, error } = useQuery({
		queryKey: ["storefront", "payment-status", orderId],
		queryFn: () => getOrderPaymentStatus(orderId as string, tenantId),
		enabled: Boolean(orderId),
		refetchInterval: (query) => {
			const status = query.state.data?.status
			if (status && status !== "PENDING") return false
			if (Date.now() > (deadlineRef.current ?? 0)) return false
			return POLL_INTERVAL_MS
		},
	})

	// The cart survived the redirect on purpose (failed payments keep it for a
	// retry); only a confirmed charge empties it.
	const clearedRef = useRef(false)
	useEffect(() => {
		if (data?.status === "PAID" && !clearedRef.current) {
			clearedRef.current = true
			clearCart()
		}
	}, [data?.status])

	if (!orderId) {
		return (
			<OrdersMessage
				title="رابط غير صالح"
				description="لا يمكن التحقق من عملية الدفع بدون رقم الطلب."
				action={{ href: basePath, label: "العودة إلى المتجر" }}
			/>
		)
	}

	if (error) {
		return (
			<OrdersMessage
				title="تعذّر التحقق من حالة الدفع"
				description="حدث خطأ أثناء الاتصال بالخادم. يمكنك متابعة حالة طلبك من صفحة طلباتي."
				action={{ href: `${basePath}/orders`, label: "عرض طلباتي" }}
			/>
		)
	}

	const status = data?.status

	if (status === "PAID") {
		return (
			<OrdersMessage
				title="تم الدفع بنجاح 🎉"
				description={
					data?.rrn
						? `تم تأكيد طلبك وسيبدأ تجهيزه. الرقم المرجعي للعملية: ${data.rrn}`
						: "تم تأكيد طلبك وسيبدأ تجهيزه."
				}
				action={{ href: `${basePath}/orders`, label: "عرض طلباتي" }}
			/>
		)
	}

	if (status === "FAILED") {
		return (
			<OrdersMessage
				title="فشلت عملية الدفع"
				description="لم يتم خصم أي مبلغ مؤكد. سلتك محفوظة — يمكنك إعادة المحاولة من صفحة إتمام الطلب."
				action={{ href: `${basePath}/checkout`, label: "إعادة المحاولة" }}
			/>
		)
	}

	if (status === "UNPAID") {
		return (
			<OrdersMessage
				title="تم إلغاء عملية الدفع"
				description="ألغيت عملية الدفع قبل إتمامها. سلتك محفوظة — يمكنك إعادة المحاولة متى شئت."
				action={{ href: `${basePath}/checkout`, label: "العودة إلى إتمام الطلب" }}
			/>
		)
	}

	if (status === "PENDING" && Date.now() > (deadlineRef.current ?? 0)) {
		return (
			<OrdersMessage
				title="الدفع قيد التأكيد"
				description="لم تصلنا نتيجة نهائية من بوابة الدفع بعد. تابع حالة طلبك من صفحة طلباتي — ستتحدث تلقائياً فور التأكيد."
				action={{ href: `${basePath}/orders`, label: "عرض طلباتي" }}
			/>
		)
	}

	return (
		<OrdersMessage
			title="جارٍ التحقق من حالة الدفع…"
			description="نتحقق الآن من نتيجة العملية مع بوابة الدفع. لا تغلق هذه الصفحة."
		/>
	)
}
