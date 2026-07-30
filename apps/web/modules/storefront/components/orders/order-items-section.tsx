"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
	customerOrderKeys,
	formatOrderMoney,
	type CustomerOrder,
	type CustomerOrderItem,
} from "../../lib/customer-orders-api"
import {
	createCustomerReturn,
	customerReturnKeys,
	DEFAULT_RETURN_ITEM_CONDITION,
	isOrderReturnable,
	RETURN_ITEM_CONDITION_LABELS,
	RETURN_ITEM_CONDITIONS,
	type CreateReturnItemPayload,
	type ReturnItemCondition,
} from "../../lib/customer-returns-api"
import { useStoreTenant } from "../../lib/store-tenant-context"
import { getOrdersErrorMessage } from "./orders-error"

type SelectedItem = {
	quantity: number
	condition: ReturnItemCondition
}

/** `orderItemId` is what the returns endpoint keys on — items without one can't be returned. */
const itemKey = (item: CustomerOrderItem, index: number): string =>
	item.orderItemId ?? `no-id-${index}`

export function OrderItemsSection({ order }: { order: CustomerOrder }) {
	const { basePath } = useStoreTenant()
	const queryClient = useQueryClient()
	const currency = order.currencyCode
	const items = useMemo(() => order.items ?? [], [order.items])

	const [selection, setSelection] = useState<Record<string, SelectedItem>>({})
	const [dialogOpen, setDialogOpen] = useState(false)
	const [reason, setReason] = useState("")
	const [submitted, setSubmitted] = useState(false)

	const returnable = isOrderReturnable(order.orderStatus)
	const selectedIds = Object.keys(selection)

	const toggleItem = (id: string, item: CustomerOrderItem) => {
		setSelection((prev) => {
			if (prev[id]) {
				const next = { ...prev }
				delete next[id]
				return next
			}
			return {
				...prev,
				[id]: {
					quantity: Math.max(1, item.quantity ?? 1),
					condition: DEFAULT_RETURN_ITEM_CONDITION,
				},
			}
		})
	}

	const patchItem = (id: string, patch: Partial<SelectedItem>) => {
		setSelection((prev) =>
			prev[id] ? { ...prev, [id]: { ...prev[id], ...patch } } : prev,
		)
	}

	const submit = useMutation({
		mutationFn: () =>
			createCustomerReturn({
				orderId: order.orderId,
				reason: reason.trim(),
				items: selectedIds.map<CreateReturnItemPayload>((id) => ({
					orderItemId: id,
					quantity: selection[id]!.quantity,
					itemCondition: selection[id]!.condition,
				})),
			}),
		onSuccess: async () => {
			setDialogOpen(false)
			setReason("")
			setSelection({})
			setSubmitted(true)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: customerReturnKeys.all }),
				queryClient.invalidateQueries({
					queryKey: customerOrderKeys.detail(order.orderId),
				}),
			])
		},
	})

	const closeDialog = useCallback(() => {
		if (submit.isPending) return
		setDialogOpen(false)
		submit.reset()
	}, [submit])

	useEffect(() => {
		if (!dialogOpen) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeDialog()
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [dialogOpen, closeDialog])

	return (
		<section className="OrderSection">
			<h2 className="OrderSection-title">المنتجات</h2>

			{items.length === 0 ? (
				<p className="OrderSection-empty">لا توجد منتجات في هذا الطلب.</p>
			) : (
				<ul className="OrderItems">
					{items.map((item, index) => {
						const id = itemKey(item, index)
						const selectable = returnable && Boolean(item.orderItemId)
						const selected = selection[id]
						const maxQuantity = Math.max(1, item.quantity ?? 1)

						return (
							<li className="OrderItem" key={id}>
								<div className="OrderItem-main">
									{selectable ? (
										<label className="OrderItem-select">
											<input
												type="checkbox"
												checked={Boolean(selected)}
												onChange={() => toggleItem(id, item)}
											/>
											<span className="OrderItem-title">
												{item.productTitle ?? item.variantTitle ?? "منتج"}
											</span>
										</label>
									) : (
										<span className="OrderItem-title">
											{item.productTitle ?? item.variantTitle ?? "منتج"}
										</span>
									)}
									{item.sku && <span className="OrderItem-sku">{item.sku}</span>}

									{selected && (
										<div className="OrderItem-return">
											<label className="OrderItem-returnField">
												<span>الكمية المُرجعة</span>
												<input
													type="number"
													min={1}
													max={maxQuantity}
													value={selected.quantity}
													onChange={(event) => {
														const next = Number(event.target.value)
														patchItem(id, {
															quantity: Number.isFinite(next)
																? Math.min(Math.max(1, next), maxQuantity)
																: 1,
														})
													}}
												/>
											</label>
											<label className="OrderItem-returnField">
												<span>حالة المنتج</span>
												<select
													value={selected.condition}
													onChange={(event) =>
														patchItem(id, {
															condition: event.target
																.value as ReturnItemCondition,
														})
													}
												>
													{RETURN_ITEM_CONDITIONS.map((condition) => (
														<option key={condition} value={condition}>
															{RETURN_ITEM_CONDITION_LABELS[condition]}
														</option>
													))}
												</select>
											</label>
										</div>
									)}
								</div>

								<div className="OrderItem-numbers">
									<span className="OrderItem-qty">
										{item.quantity ?? 0} ×{" "}
										{formatOrderMoney(item.unitPrice, currency)}
									</span>
									<span className="OrderItem-total">
										{formatOrderMoney(item.totalPrice, currency)}
									</span>
								</div>
							</li>
						)
					})}
				</ul>
			)}

			{returnable && items.length > 0 && (
				<div className="OrderReturn-bar">
					<p className="OrderSection-note">
						{selectedIds.length === 0
							? "اختر المنتجات التي ترغب بإرجاعها."
							: `تم اختيار ${selectedIds.length} منتج للإرجاع.`}
					</p>
					<button
						type="button"
						className="OrdersButton OrdersButton--primary"
						onClick={() => {
							setSubmitted(false)
							setDialogOpen(true)
						}}
						disabled={selectedIds.length === 0}
					>
						طلب إرجاع المنتجات
					</button>
				</div>
			)}

			{submitted && (
				<p className="OrderReturn-success" role="status">
					تم إرسال طلب الإرجاع.{" "}
					<Link href={`${basePath}/returns`}>عرض مرتجعاتي</Link>
				</p>
			)}

			{dialogOpen && (
				<div
					className="OrdersDialog-overlay"
					role="dialog"
					aria-modal="true"
					aria-label="طلب إرجاع المنتجات"
					onClick={closeDialog}
				>
					<div
						className="OrdersDialog"
						onClick={(event) => event.stopPropagation()}
					>
						<h2 className="OrdersDialog-title">طلب إرجاع المنتجات</h2>
						<p className="OrdersDialog-text">
							سيتم إرسال طلب إرجاع لـ {selectedIds.length} منتج من الطلب{" "}
							{order.orderNumber ?? order.orderId}.
						</p>

						<label className="OrdersDialog-label" htmlFor="return-reason">
							سبب الإرجاع
						</label>
						<textarea
							id="return-reason"
							className="OrdersDialog-textarea"
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							rows={3}
							placeholder="مثال: المنتج وصل تالفاً"
						/>

						{submit.error && (
							<p className="OrdersError" role="alert">
								{getOrdersErrorMessage(submit.error, "تعذّر إرسال طلب الإرجاع.")}
							</p>
						)}

						<div className="OrdersDialog-actions">
							<button
								type="button"
								className="OrdersButton"
								onClick={closeDialog}
								disabled={submit.isPending}
							>
								تراجع
							</button>
							<button
								type="button"
								className="OrdersButton OrdersButton--primary"
								onClick={() => submit.mutate()}
								disabled={submit.isPending || reason.trim().length === 0}
							>
								{submit.isPending ? "جارٍ الإرسال…" : "إرسال الطلب"}
							</button>
						</div>
					</div>
				</div>
			)}
		</section>
	)
}
