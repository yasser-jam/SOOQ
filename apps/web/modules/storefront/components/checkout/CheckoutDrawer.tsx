"use client"

import React, { useCallback, useEffect, useSyncExternalStore, useState } from "react"
import { createPortal } from "react-dom"
import {
	clearCart,
	formatCartMoney,
	getCartSubtotal,
	getProductTitle,
	type StoreCart,
} from "@/core/config/cart/store-cart"
import {
	defaultCheckoutFormValues,
	getCheckoutCustomerFromCookies,
	isCustomerAuthenticated,
	submitCheckoutOrder,
	validateCheckoutForm,
	type CheckoutFormErrors,
	type CheckoutFormValues,
} from "./checkout-api"
import { CheckoutMapPicker } from "./checkout-map-picker"
import { SaveAddressPanel } from "./save-address-panel"

type CheckoutDrawerProps = {
	open: boolean
	onClose: () => void
	cart: StoreCart | null
	tenantId: string | null
}

export function CheckoutDrawer({ open, onClose, cart, tenantId }: CheckoutDrawerProps) {
	const portalRoot = useSyncExternalStore(
		() => () => {},
		() => document.body,
		() => null,
	)
	const [form, setForm] = useState<CheckoutFormValues>(defaultCheckoutFormValues)
	const [errors, setErrors] = useState<CheckoutFormErrors>({})
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [succeeded, setSucceeded] = useState(false)

	const recipient = getCheckoutCustomerFromCookies()

	useEffect(() => {
		if (!open) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose()
		}
		window.addEventListener("keydown", onKeyDown)
		return () => window.removeEventListener("keydown", onKeyDown)
	}, [open, onClose])

	useEffect(() => {
		if (!open) return
		const prev = document.body.style.overflow
		document.body.style.overflow = "hidden"
		return () => {
			document.body.style.overflow = prev
		}
	}, [open])

	const set = useCallback(
		(field: keyof CheckoutFormValues) => (value: string) => {
			setForm((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => ({ ...prev, [field]: undefined }))
			setSubmitError(null)
		},
		[],
	)

	const setCoords = useCallback(
		(coords: { latitude: number; longitude: number }) => {
			setForm((prev) => ({ ...prev, ...coords }))
			setErrors((prev) => ({ ...prev, latitude: undefined }))
			setSubmitError(null)
		},
		[],
	)

	const handleClose = useCallback(() => {
		setForm(defaultCheckoutFormValues())
		setErrors({})
		setSubmitError(null)
		setSucceeded(false)
		setLoading(false)
		onClose()
	}, [onClose])

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			setSubmitError(null)

			const validationErrors = validateCheckoutForm(form)
			if (Object.keys(validationErrors).length > 0) {
				setErrors(validationErrors)
				return
			}

			if (!cart || cart.items.length === 0) {
				setSubmitError("السلة فارغة.")
				return
			}

			setLoading(true)
			try {
				await submitCheckoutOrder(cart, form, tenantId)
				clearCart()
				setSucceeded(true)
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "حدث خطأ أثناء تقديم الطلب."
				setSubmitError(msg)
			} finally {
				setLoading(false)
			}
		},
		[form, cart, tenantId],
	)

	if (!open || !portalRoot) return null

	const subtotal = cart ? getCartSubtotal(cart) : 0
	const currency = cart?.items[0]?.product.currencyCode ?? "SYP"

	const content = (
		<div
			className="CheckoutDrawer-overlay"
			dir="rtl"
			onClick={handleClose}
			role="presentation"
		>
			<div
				className="CheckoutDrawer-card"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="إتمام الطلب"
			>
				{succeeded ? (
					<div className="CheckoutDrawer-success">
						<h2 className="CheckoutDrawer-title">تم استلام طلبك</h2>
						<p>سنتواصل معك قريبًا لتأكيد التوصيل.</p>
						<button
							type="button"
							onClick={handleClose}
							className="CheckoutDrawer-submit"
						>
							إغلاق
						</button>
					</div>
				) : (
					<form onSubmit={handleSubmit} noValidate>
						<div className="CheckoutDrawer-header">
							<h2 className="CheckoutDrawer-title">إتمام الطلب</h2>
							<button
								type="button"
								onClick={handleClose}
								className="CheckoutDrawer-close"
							>
								إغلاق
							</button>
						</div>

						{cart && cart.items.length > 0 && (
							<div className="CheckoutDrawer-section">
								{cart.items.map((line) => (
									<div key={line.lineId} className="CheckoutDrawer-line">
										<span>
											{line.quantity} × {getProductTitle(line)}
										</span>
										<span>
											{formatCartMoney(
												line.pricing.price * line.quantity,
												currency,
											)}
										</span>
									</div>
								))}
								<div className="CheckoutDrawer-total">
									<span>المجموع</span>
									<span>{formatCartMoney(subtotal, currency)}</span>
								</div>
							</div>
						)}

						<div className="CheckoutDrawer-meta">
							<p>اسم المستلم: {recipient.recipientName || "—"}</p>
							<p dir="ltr">رقم الهاتف: {recipient.phone || "—"}</p>
						</div>

						<div className="CheckoutDrawer-field">
							<label htmlFor="addressLabel" className="CheckoutDrawer-label">
								وصف العنوان
							</label>
							<input
								id="addressLabel"
								value={form.addressLabel}
								onChange={(e) => set("addressLabel")(e.target.value)}
								placeholder="شارع الحمرا، بناء 5، دمشق"
								className="CheckoutDrawer-input"
							/>
							{errors.addressLabel && (
								<p className="CheckoutDrawer-error" role="alert">
									{errors.addressLabel}
								</p>
							)}
						</div>

						<div className="CheckoutDrawer-field">
							<span className="CheckoutDrawer-label">موقع التوصيل</span>
							<CheckoutMapPicker
								latitude={form.latitude}
								longitude={form.longitude}
								onChange={setCoords}
							/>
							<p className="CheckoutDrawer-hint">
								اضغط على الخريطة أو اسحب المؤشر لتحديد موقعك بدقة.
							</p>
							{form.latitude != null && form.longitude != null && (
								<p className="CheckoutDrawer-hint" dir="ltr">
									{form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
								</p>
							)}
							{errors.latitude && (
								<p className="CheckoutDrawer-error" role="alert">
									{errors.latitude}
								</p>
							)}
						</div>

						{isCustomerAuthenticated() && <SaveAddressPanel checkout={form} />}

						<p className="CheckoutDrawer-note">الدفع عند الاستلام</p>

						{submitError && (
							<p className="CheckoutDrawer-error" role="alert">
								{submitError}
							</p>
						)}

						<button
							type="submit"
							disabled={loading || (cart?.items.length ?? 0) === 0}
							className="CheckoutDrawer-submit"
						>
							{loading ? "جاري تقديم الطلب…" : "تأكيد الطلب"}
						</button>
					</form>
				)}
			</div>
		</div>
	)

	return createPortal(content, portalRoot)
}
