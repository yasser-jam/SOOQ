"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { PAYMENT_METHOD_LABELS } from "@/lib/domain-enums"

import {
	customerOrderKeys,
	formatOrderDateTime,
	formatOrderMoney,
	getCustomerOrder,
	ORDER_TIMELINE_ACTION_LABELS,
	ORDER_TIMELINE_ACTOR_LABELS,
	type CustomerOrder,
	type CustomerOrderShippingAddress,
} from "../../lib/customer-orders-api"
import { useCustomerSession } from "../../lib/use-customer-session"
import { useStoreTenant } from "../../lib/store-tenant-context"
import { OrderActions } from "./order-actions"
import { OrderItemsSection } from "./order-items-section"
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge"
import { getOrdersErrorMessage } from "./orders-error"
import { OrdersMessage, OrdersSignInRequired } from "./orders-states"

const timelineActionLabel = (action?: string): string => {
	if (!action) return "تحديث الطلب"
	return ORDER_TIMELINE_ACTION_LABELS[action] ?? action
}

function SummaryRow({
	label,
	value,
	strong,
}: {
	label: string
	value: string
	strong?: boolean
}) {
	return (
		<div className={strong ? "OrderSummary-row OrderSummary-row--total" : "OrderSummary-row"}>
			<span>{label}</span>
			<span>{value}</span>
		</div>
	)
}

function ShippingAddressSection({
	address,
}: {
	address: CustomerOrderShippingAddress
}) {
	const hasCoords =
		typeof address.latitude === "number" && typeof address.longitude === "number"

	return (
		<section className="OrderSection">
			<h2 className="OrderSection-title">عنوان التوصيل</h2>
			<p className="OrderAddress-line">{address.recipientName ?? "—"}</p>
			{address.phone && <p className="OrderAddress-line">{address.phone}</p>}
			{address.addressLabel && (
				<p className="OrderAddress-line">{address.addressLabel}</p>
			)}
			{hasCoords && (
				<a
					className="OrderAddress-map"
					href={`https://www.openstreetmap.org/?mlat=${address.latitude}&mlon=${address.longitude}#map=17/${address.latitude}/${address.longitude}`}
					target="_blank"
					rel="noreferrer"
				>
					عرض الموقع على الخريطة
				</a>
			)}
		</section>
	)
}

function OrderContent({ order }: { order: CustomerOrder }) {
	const currency = order.currencyCode
	const timeline = order.timeline ?? []

	return (
		<>
			<header className="OrderDetail-header">
				<div>
					<h1 className="OrderDetail-number">
						{order.orderNumber ?? order.orderId}
					</h1>
					<p className="OrderDetail-date">
						{formatOrderDateTime(order.placedAt)}
					</p>
				</div>
				<div className="OrderCard-badges">
					<OrderStatusBadge status={order.orderStatus} />
					<PaymentStatusBadge status={order.paymentStatus} />
				</div>
			</header>

			<OrderActions order={order} />

			<OrderItemsSection order={order} />

			<section className="OrderSection">
				<h2 className="OrderSection-title">ملخّص الدفع</h2>
				<div className="OrderSummary">
					<SummaryRow
						label="المجموع الفرعي"
						value={formatOrderMoney(order.subtotal, currency)}
					/>
					{Boolean(order.discountAmount) && (
						<SummaryRow
							label="الخصم"
							value={`− ${formatOrderMoney(order.discountAmount, currency)}`}
						/>
					)}
					{Boolean(order.taxAmount) && (
						<SummaryRow
							label="الضريبة"
							value={formatOrderMoney(order.taxAmount, currency)}
						/>
					)}
					<SummaryRow
						label="تكلفة الشحن"
						value={formatOrderMoney(order.shippingCost ?? 0, currency)}
					/>
					<SummaryRow
						label="الإجمالي"
						value={formatOrderMoney(order.total, currency)}
						strong
					/>
				</div>
				{order.paymentMethod && (
					<p className="OrderSection-note">
						طريقة الدفع: {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
					</p>
				)}
			</section>

			{order.shippingAddress && (
				<ShippingAddressSection address={order.shippingAddress} />
			)}

			{order.notesCustomer && (
				<section className="OrderSection">
					<h2 className="OrderSection-title">ملاحظاتك</h2>
					<p className="OrderSection-note">{order.notesCustomer}</p>
				</section>
			)}

			{timeline.length > 0 && (
				<section className="OrderSection">
					<h2 className="OrderSection-title">سجلّ الطلب</h2>
					<ol className="OrderTimeline">
						{timeline.map((entry, index) => (
							<li className="OrderTimeline-entry" key={entry.timelineId ?? index}>
								<span className="OrderTimeline-dot" aria-hidden="true" />
								<div>
									<p className="OrderTimeline-action">
										{timelineActionLabel(entry.action)}
									</p>
									<p className="OrderTimeline-meta">
										{formatOrderDateTime(entry.createdAt)}
										{entry.actor
											? ` · ${ORDER_TIMELINE_ACTOR_LABELS[entry.actor] ?? entry.actor}`
											: ""}
									</p>
									{entry.details && (
										<p className="OrderTimeline-details">{entry.details}</p>
									)}
								</div>
							</li>
						))}
					</ol>
				</section>
			)}
		</>
	)
}

export function OrderDetailView({ orderId }: { orderId: string }) {
	const { basePath } = useStoreTenant()
	const signedIn = useCustomerSession()

	const { data, isPending, error } = useQuery({
		queryKey: customerOrderKeys.detail(orderId),
		queryFn: () => getCustomerOrder(orderId),
		enabled: signedIn === true,
	})

	if (signedIn === null) {
		return <OrdersMessage title="جارٍ التحميل…" />
	}

	if (!signedIn) {
		return <OrdersSignInRequired basePath={basePath} />
	}

	if (error) {
		return (
			<OrdersMessage
				title="تعذّر تحميل الطلب"
				description={getOrdersErrorMessage(error, "تحقّق من الرابط أو حاول لاحقاً.")}
				action={{ href: `${basePath}/orders`, label: "العودة إلى الطلبات" }}
			/>
		)
	}

	if (isPending) {
		return <OrdersMessage title="جارٍ تحميل الطلب…" />
	}

	return (
		<div className="OrderDetail">
			<Link className="OrdersBack" href={`${basePath}/orders`}>
				← كل الطلبات
			</Link>
			<OrderContent order={data} />
		</div>
	)
}
