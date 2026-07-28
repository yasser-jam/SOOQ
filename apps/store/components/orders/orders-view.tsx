"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import {
	customerOrderKeys,
	formatOrderDateTime,
	formatOrderMoney,
	listCustomerOrders,
	ORDERS_PAGE_SIZE,
	type CustomerOrderListItem,
} from "../../lib/customer-orders-api"
import { useCustomerSession } from "../../lib/use-customer-session"
import { useStoreTenant } from "../../lib/store-tenant-context"
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge"
import { OrdersMessage, OrdersSignInRequired } from "./orders-states"
import { getOrdersErrorMessage } from "./orders-error"

function OrderCard({
	order,
	basePath,
}: {
	order: CustomerOrderListItem
	basePath: string
}) {
	return (
		<Link className="OrderCard" href={`${basePath}/orders/${order.orderId}`}>
			<div className="OrderCard-head">
				<span className="OrderCard-number">
					{order.orderNumber ?? order.orderId}
				</span>
				<span className="OrderCard-badges">
					<OrderStatusBadge status={order.orderStatus} />
					<PaymentStatusBadge status={order.paymentStatus} />
				</span>
			</div>

			<dl className="OrderCard-meta">
				<div>
					<dt>تاريخ الطلب</dt>
					<dd>{formatOrderDateTime(order.placedAt) || "—"}</dd>
				</div>
				<div>
					<dt>عدد المنتجات</dt>
					<dd>{order.itemCount ?? 0}</dd>
				</div>
			</dl>

			<div className="OrderCard-foot">
				<span className="OrderCard-total-label">الإجمالي</span>
				<span className="OrderCard-total">{formatOrderMoney(order.total)}</span>
			</div>
		</Link>
	)
}

export function OrdersView() {
	const { basePath } = useStoreTenant()
	const [page, setPage] = useState(0)
	const signedIn = useCustomerSession()

	const { data, isPending, isFetching, error } = useQuery({
		queryKey: customerOrderKeys.list(page, ORDERS_PAGE_SIZE),
		queryFn: () => listCustomerOrders({ page, size: ORDERS_PAGE_SIZE }),
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
				title="تعذّر تحميل الطلبات"
				description={getOrdersErrorMessage(error, "حاول تحديث الصفحة.")}
			/>
		)
	}

	if (isPending) {
		return <OrdersMessage title="جارٍ تحميل الطلبات…" />
	}

	if (data.items.length === 0) {
		return (
			<OrdersMessage
				title="لا توجد طلبات بعد"
				description="ستظهر طلباتك هنا فور إتمام أول عملية شراء."
				action={{ href: basePath, label: "تصفّح المتجر" }}
			/>
		)
	}

	return (
		<div className="OrdersList" aria-busy={isFetching}>
			<div className="OrdersList-grid">
				{data.items.map((order) => (
					<OrderCard key={order.orderId} order={order} basePath={basePath} />
				))}
			</div>

			{data.totalPages > 1 && (
				<nav className="OrdersPager" aria-label="تنقّل بين صفحات الطلبات">
					<button
						type="button"
						className="OrdersButton"
						onClick={() => setPage((prev) => Math.max(0, prev - 1))}
						disabled={!data.hasPrev || isFetching}
					>
						السابق
					</button>
					<span className="OrdersPager-status">
						صفحة {data.pageIndex + 1} من {data.totalPages}
					</span>
					<button
						type="button"
						className="OrdersButton"
						onClick={() => setPage((prev) => prev + 1)}
						disabled={!data.hasNext || isFetching}
					>
						التالي
					</button>
				</nav>
			)}
		</div>
	)
}
