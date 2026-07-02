"use client"

import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react"
import {
	clearCart,
	formatCartMoney,
	getCartSubtotal,
	getProductTitle,
	type StoreCart,
} from "@/core/config/cart/store-cart"
import {
	mapCartToOrderItems,
	submitCheckoutOrder,
	validateCheckoutForm,
	type CheckoutFormErrors,
	type CheckoutFormValues,
} from "./checkout-api"

// ─── Primitives ───────────────────────────────────────────────────────────────

function Field({
	id,
	label,
	error,
	children,
}: {
	id: string
	label: string
	error?: string
	children: React.ReactNode
}) {
	return (
		<div className="flex flex-col gap-1.5">
			<label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-gray-500">
				{label}
			</label>
			{children}
			{error && (
				<p className="flex items-center gap-1 text-xs text-red-500" role="alert">
					<span aria-hidden>⚠</span> {error}
				</p>
			)}
		</div>
	)
}

function TextInput({
	id,
	value,
	onChange,
	placeholder,
	type = "text",
	dir,
	hasError,
	inputMode,
}: {
	id: string
	value: string
	onChange: (v: string) => void
	placeholder?: string
	type?: string
	dir?: "ltr" | "rtl"
	hasError?: boolean
	inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"]
}) {
	return (
		<input
			id={id}
			type={type}
			value={value}
			inputMode={inputMode}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			dir={dir}
			className={[
				"w-full rounded-xl border-2 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all",
				"placeholder:text-gray-300",
				hasError
					? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-100"
					: "border-gray-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-50",
			].join(" ")}
		/>
	)
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ icon, title }: { icon: string; title: string }) {
	return (
		<div className="flex items-center gap-2 pb-1">
			<span className="flex size-7 items-center justify-center rounded-lg bg-blue-50 text-sm" aria-hidden>
				{icon}
			</span>
			<span className="text-sm font-bold text-gray-700">{title}</span>
		</div>
	)
}

// ─── Order summary ────────────────────────────────────────────────────────────

function OrderSummary({ cart }: { cart: StoreCart }) {
	const subtotal = useMemo(() => getCartSubtotal(cart), [cart])
	const currency = cart.items[0]?.product.currencyCode ?? "SYP"
	const { warnings } = useMemo(() => mapCartToOrderItems(cart), [cart])

	return (
		<div className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
			<div className="border-b border-blue-100 px-4 py-3">
				<SectionHeading icon="🛒" title="ملخص الطلب" />
			</div>
			<div className="divide-y divide-blue-100/60 px-4">
				{cart.items.map((line) => {
					const title = getProductTitle(line)
					const hasVariant = Boolean(line.selectedVariant?.variantId)
					return (
						<div
							key={line.lineId}
							className={`flex items-center justify-between py-3 text-sm ${!hasVariant ? "opacity-40" : ""}`}
						>
							<div className="flex min-w-0 flex-1 items-center gap-2">
								<span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-700 shadow-sm">
									{line.quantity}
								</span>
								<span className="truncate text-gray-800">{title}</span>
								{!hasVariant && (
									<span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
										بدون متغيّر
									</span>
								)}
							</div>
							<span className="ms-3 shrink-0 font-semibold text-gray-900">
								{formatCartMoney(line.pricing.price * line.quantity, currency)}
							</span>
						</div>
					)
				})}
			</div>
			{warnings.length > 0 && (
				<div className="border-t border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
					سيتم استبعاد المنتجات التالية (لا يوجد معرّف متغيّر):&nbsp;
					{warnings.map((w) => w.productTitle).join("، ")}
				</div>
			)}
			<div className="flex items-center justify-between bg-white/60 px-4 py-3 text-sm">
				<span className="font-semibold text-gray-600">المجموع</span>
				<span className="text-base font-bold text-blue-700">{formatCartMoney(subtotal, currency)}</span>
			</div>
		</div>
	)
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ onClose }: { onClose: () => void }) {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 py-12 text-center">
			<div className="relative">
				<div className="size-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 opacity-15" />
				<div className="absolute inset-0 flex items-center justify-center text-5xl">
					✅
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-bold text-gray-900">تم استلام طلبك!</h2>
				<p className="text-sm leading-relaxed text-gray-500">
					سنتواصل معك قريبًا لتأكيد التوصيل وتحديد الموعد.
				</p>
			</div>
			<button
				type="button"
				onClick={onClose}
				className="w-full max-w-xs rounded-2xl bg-gradient-to-l from-blue-600 to-blue-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-blue-600 active:scale-95"
			>
				العودة للتسوق
			</button>
		</div>
	)
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
	return (
		<svg
			className="size-4 animate-spin"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden
		>
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
			<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
		</svg>
	)
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

const EMPTY_FORM: CheckoutFormValues = {
	recipientName: "",
	phone: "",
	addressLabel: "",
	latitude: "",
	longitude: "",
	guestEmail: "",
}

type CheckoutDrawerProps = {
	open: boolean
	onClose: () => void
	cart: StoreCart | null
	tenantId: string | null
}

export function CheckoutDrawer({ open, onClose, cart, tenantId }: CheckoutDrawerProps) {
	const dialogRef = useRef<HTMLDialogElement>(null)
	const [panelVisible, setPanelVisible] = useState(false)

	const [form, setForm] = useState<CheckoutFormValues>(EMPTY_FORM)
	const [errors, setErrors] = useState<CheckoutFormErrors>({})
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [succeeded, setSucceeded] = useState(false)

	// ── Open / close the native <dialog> with animation ──────────────────────
	useEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		if (open) {
			dialog.showModal()
			// Next frame so the CSS transition fires after display:block
			requestAnimationFrame(() => setPanelVisible(true))
		} else {
			setPanelVisible(false)
			const t = setTimeout(() => dialog.close(), 280)
			return () => clearTimeout(t)
		}
	}, [open])

	// Close when the dialog fires its own close event (Escape key)
	useEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return
		const handler = () => {
			setPanelVisible(false)
			onClose()
		}
		dialog.addEventListener("close", handler)
		return () => dialog.removeEventListener("close", handler)
	}, [onClose])

	// ── Form helpers ─────────────────────────────────────────────────────────
	const set = useCallback(
		(field: keyof CheckoutFormValues) => (value: string) => {
			setForm((prev) => ({ ...prev, [field]: value }))
			setErrors((prev) => ({ ...prev, [field]: undefined }))
			setSubmitError(null)
		},
		[],
	)

	const handleClose = useCallback(() => {
		if (succeeded) {
			setForm(EMPTY_FORM)
			setErrors({})
			setSubmitError(null)
			setSucceeded(false)
		}
		onClose()
	}, [succeeded, onClose])

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

	return (
		<>
			{/* Backdrop + slide animation injected once */}
			<style>{`
				dialog.checkout-dialog {
					position: fixed;
					inset: 0;
					margin: 0;
					padding: 0;
					width: 100%;
					height: 100%;
					max-width: 100%;
					max-height: 100%;
					border: none;
					background: transparent;
					overflow: visible;
				}
				dialog.checkout-dialog::backdrop {
					background: rgba(0, 0, 0, 0.45);
					backdrop-filter: blur(3px);
					-webkit-backdrop-filter: blur(3px);
					transition: opacity 0.28s ease;
				}
			`}</style>

			<dialog
				ref={dialogRef}
				className="checkout-dialog"
				aria-label="إتمام الطلب"
				dir="rtl"
			>
				{/* Clickable backdrop area */}
				<div
					className="absolute inset-0"
					onClick={handleClose}
					aria-hidden="true"
				/>

				{/* Sliding panel */}
				<div
					className={[
						"absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl",
						"transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]",
						panelVisible ? "translate-x-0" : "translate-x-full",
					].join(" ")}
					onClick={(e) => e.stopPropagation()}
				>
					{/* ── Header ─────────────────────────────────────────────── */}
					<div className="relative shrink-0 overflow-hidden bg-gradient-to-l from-blue-600 to-blue-500 px-5 py-5 text-white">
						<div className="flex items-center justify-between">
							<div>
								<h2 className="text-lg font-bold">إتمام الطلب</h2>
								<p className="mt-0.5 text-xs text-blue-100">
									{cart?.items.length ?? 0} منتج في سلتك
								</p>
							</div>
							<button
								type="button"
								onClick={handleClose}
								className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30 active:scale-90"
								aria-label="إغلاق"
							>
								<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-4">
									<path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
								</svg>
							</button>
						</div>
						{/* Decorative circles */}
						<div className="pointer-events-none absolute -bottom-6 -left-6 size-24 rounded-full bg-white/5" aria-hidden />
						<div className="pointer-events-none absolute -top-4 left-8 size-16 rounded-full bg-white/5" aria-hidden />
					</div>

					{/* ── Body ───────────────────────────────────────────────── */}
					{succeeded ? (
						<SuccessScreen onClose={handleClose} />
					) : (
						<form
							onSubmit={handleSubmit}
							noValidate
							className="flex flex-1 flex-col overflow-hidden"
						>
							<div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">

								{/* Order summary */}
								{cart && cart.items.length > 0 && <OrderSummary cart={cart} />}

								{/* Divider */}
								<div className="h-px bg-gray-100" aria-hidden />

								{/* Recipient info */}
								<div className="flex flex-col gap-4">
									<SectionHeading icon="👤" title="معلومات المستلم" />

									<Field id="recipientName" label="اسم المستلم" error={errors.recipientName}>
										<TextInput
											id="recipientName"
											value={form.recipientName}
											onChange={set("recipientName")}
											placeholder="أحمد علي"
											hasError={Boolean(errors.recipientName)}
										/>
									</Field>

									<div className="grid grid-cols-2 gap-3">
										<Field id="phone" label="رقم الهاتف" error={errors.phone}>
											<TextInput
												id="phone"
												value={form.phone}
												onChange={set("phone")}
												placeholder="+963944…"
												type="tel"
												dir="ltr"
												inputMode="tel"
												hasError={Boolean(errors.phone)}
											/>
										</Field>

										<Field id="guestEmail" label="البريد الإلكتروني" error={errors.guestEmail}>
											<TextInput
												id="guestEmail"
												value={form.guestEmail}
												onChange={set("guestEmail")}
												placeholder="you@example.com"
												type="email"
												dir="ltr"
												inputMode="email"
												hasError={Boolean(errors.guestEmail)}
											/>
										</Field>
									</div>
								</div>

								{/* Divider */}
								<div className="h-px bg-gray-100" aria-hidden />

								{/* Delivery location */}
								<div className="flex flex-col gap-4">
									<SectionHeading icon="📍" title="موقع التوصيل" />

									<Field id="addressLabel" label="وصف العنوان" error={errors.addressLabel}>
										<TextInput
											id="addressLabel"
											value={form.addressLabel}
											onChange={set("addressLabel")}
											placeholder="شارع الحمرا، بناء 5، دمشق"
											hasError={Boolean(errors.addressLabel)}
										/>
									</Field>

									<div className="grid grid-cols-2 gap-3">
										<Field id="latitude" label="خط العرض (lat)" error={errors.latitude}>
											<TextInput
												id="latitude"
												value={form.latitude}
												onChange={set("latitude")}
												placeholder="33.5138"
												type="number"
												dir="ltr"
												inputMode="decimal"
												hasError={Boolean(errors.latitude)}
											/>
										</Field>

										<Field id="longitude" label="خط الطول (lng)" error={errors.longitude}>
											<TextInput
												id="longitude"
												value={form.longitude}
												onChange={set("longitude")}
												placeholder="36.2765"
												type="number"
												dir="ltr"
												inputMode="decimal"
												hasError={Boolean(errors.longitude)}
											/>
										</Field>
									</div>
								</div>

								{/* Divider */}
								<div className="h-px bg-gray-100" aria-hidden />

								{/* Payment */}
								<div className="flex flex-col gap-3">
									<SectionHeading icon="💳" title="طريقة الدفع" />
									<div className="flex items-center gap-4 rounded-2xl border-2 border-blue-100 bg-blue-50 px-4 py-3.5">
										<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
											💵
										</span>
										<div>
											<p className="text-sm font-bold text-gray-900">الدفع عند الاستلام</p>
											<p className="text-xs text-gray-500">ادفع نقدًا عند تسليم الطلب</p>
										</div>
										<div className="ms-auto shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
											COD
										</div>
									</div>
								</div>

								{/* Submit error */}
								{submitError && (
									<div
										className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700"
										role="alert"
									>
										<span className="mt-0.5 shrink-0 text-base" aria-hidden>⚠️</span>
										<span>{submitError}</span>
									</div>
								)}
							</div>

							{/* ── Footer ─────────────────────────────────────── */}
							<div className="shrink-0 border-t border-gray-100 bg-gray-50/80 px-5 py-4 backdrop-blur-sm">
								<button
									type="submit"
									disabled={loading || (cart?.items.length ?? 0) === 0}
									className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-l from-blue-600 to-blue-500 px-4 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200/50 transition-all hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
								>
									<span className="flex items-center justify-center gap-2">
										{loading ? (
											<><Spinner /> جاري تقديم الطلب…</>
										) : (
											<>
												<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
													<path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
												تأكيد وإرسال الطلب
											</>
										)}
									</span>
								</button>
							</div>
						</form>
					)}
				</div>
			</dialog>
		</>
	)
}
