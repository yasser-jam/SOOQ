"use client"

import { useCallback, useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
	cancelCustomerOrder,
	customerOrderKeys,
	downloadOrderInvoice,
	isOrderCancellable,
	type CustomerOrder,
} from "../../lib/customer-orders-api"
import { getOrdersErrorMessage } from "./orders-error"

type OrderActionsProps = {
	order: CustomerOrder
}

export function OrderActions({ order }: OrderActionsProps) {
	const queryClient = useQueryClient()
	const [cancelOpen, setCancelOpen] = useState(false)
	const [reason, setReason] = useState("")

	const invoice = useMutation({
		mutationFn: () => downloadOrderInvoice(order.orderId, order.orderNumber),
	})

	const cancel = useMutation({
		mutationFn: () => cancelCustomerOrder(order.orderId, reason),
		onSuccess: async () => {
			setCancelOpen(false)
			setReason("")
			await queryClient.invalidateQueries({ queryKey: customerOrderKeys.all })
		},
	})

	const closeCancel = useCallback(() => {
		if (cancel.isPending) return
		setCancelOpen(false)
		setReason("")
		cancel.reset()
	}, [cancel])

	useEffect(() => {
		if (!cancelOpen) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeCancel()
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [cancelOpen, closeCancel])

	const cancellable = isOrderCancellable(order.orderStatus)

	return (
		<div className="OrderActions">
			<div className="OrderActions-buttons">
				<button
					type="button"
					className="OrdersButton OrdersButton--primary"
					onClick={() => invoice.mutate()}
					disabled={invoice.isPending}
				>
					{invoice.isPending ? "جارٍ التحضير…" : "تحميل الفاتورة"}
				</button>

				{cancellable && (
					<button
						type="button"
						className="OrdersButton OrdersButton--danger"
						onClick={() => setCancelOpen(true)}
					>
						إلغاء الطلب
					</button>
				)}
			</div>

			{invoice.error && (
				<p className="OrdersError" role="alert">
					{getOrdersErrorMessage(invoice.error, "تعذّر تحميل الفاتورة.")}
				</p>
			)}

			{cancelOpen && (
				<div
					className="OrdersDialog-overlay"
					role="dialog"
					aria-modal="true"
					aria-label="إلغاء الطلب"
					onClick={closeCancel}
				>
					<div
						className="OrdersDialog"
						onClick={(event) => event.stopPropagation()}
					>
						<h2 className="OrdersDialog-title">إلغاء الطلب</h2>
						<p className="OrdersDialog-text">
							سيتم إلغاء الطلب {order.orderNumber ?? order.orderId}. لا يمكن
							التراجع عن هذه الخطوة.
						</p>

						<label className="OrdersDialog-label" htmlFor="cancel-reason">
							سبب الإلغاء (اختياري)
						</label>
						<textarea
							id="cancel-reason"
							className="OrdersDialog-textarea"
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							rows={3}
							placeholder="مثال: غيّرت رأيي بشأن المنتج"
						/>

						{cancel.error && (
							<p className="OrdersError" role="alert">
								{getOrdersErrorMessage(cancel.error, "تعذّر إلغاء الطلب.")}
							</p>
						)}

						<div className="OrdersDialog-actions">
							<button
								type="button"
								className="OrdersButton"
								onClick={closeCancel}
								disabled={cancel.isPending}
							>
								تراجع
							</button>
							<button
								type="button"
								className="OrdersButton OrdersButton--danger"
								onClick={() => cancel.mutate()}
								disabled={cancel.isPending}
							>
								{cancel.isPending ? "جارٍ الإلغاء…" : "تأكيد الإلغاء"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
