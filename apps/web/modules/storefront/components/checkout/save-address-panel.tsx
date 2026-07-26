"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import {
	ADDRESS_LABEL_OPTIONS,
	defaultSavedAddressFormValues,
	reverseGeocode,
	saveCustomerAddress,
	type CheckoutFormValues,
	type SavedAddressFormValues,
} from "./checkout-api"

type SaveAddressPanelProps = {
	checkout: CheckoutFormValues
}

/**
 * Optional step inside the checkout drawer: persist the address the customer
 * just picked to their profile (`POST /customer/addresses`). Recipient name and
 * phone come from the session cookies; governorate/city are pre-filled by
 * reverse-geocoding the pin and stay editable.
 */
export function SaveAddressPanel({ checkout }: SaveAddressPanelProps) {
	const [open, setOpen] = useState(false)
	const [values, setValues] = useState<SavedAddressFormValues>(
		defaultSavedAddressFormValues,
	)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [saved, setSaved] = useState(false)

	// Geocoded values only fill fields the customer hasn't typed into yet.
	const editedRef = useRef({ governorate: false, city: false })

	const { latitude, longitude } = checkout

	useEffect(() => {
		if (!open || latitude == null || longitude == null) return

		const controller = new AbortController()

		void (async () => {
			const result = await reverseGeocode(
				latitude,
				longitude,
				controller.signal,
			)
			if (!result || controller.signal.aborted) return

			setValues((prev) => ({
				...prev,
				governorate:
					editedRef.current.governorate || !result.governorate
						? prev.governorate
						: result.governorate,
				city:
					editedRef.current.city || !result.city ? prev.city : result.city,
			}))
		})()

		return () => controller.abort()
	}, [open, latitude, longitude])

	const set = useCallback(
		<K extends keyof SavedAddressFormValues>(
			field: K,
			value: SavedAddressFormValues[K],
		) => {
			if (field === "governorate") editedRef.current.governorate = true
			if (field === "city") editedRef.current.city = true
			setValues((prev) => ({ ...prev, [field]: value }))
			setError(null)
			setSaved(false)
		},
		[],
	)

	const handleSave = useCallback(async () => {
		setError(null)
		setSaving(true)
		try {
			await saveCustomerAddress(values, checkout)
			setSaved(true)
			setOpen(false)
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "تعذّر حفظ العنوان.",
			)
		} finally {
			setSaving(false)
		}
	}, [values, checkout])

	if (saved && !open) {
		return (
			<p className="CheckoutDrawer-saved" role="status">
				تم حفظ العنوان في حسابك.
			</p>
		)
	}

	if (!open) {
		return (
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="CheckoutDrawer-secondary"
			>
				أضف هذا العنوان إلى حسابي
			</button>
		)
	}

	return (
		<div className="CheckoutDrawer-panel">
			<div className="CheckoutDrawer-field">
				<label htmlFor="addressType" className="CheckoutDrawer-label">
					نوع العنوان
				</label>
				<select
					id="addressType"
					value={values.label}
					onChange={(e) => set("label", e.target.value)}
					className="CheckoutDrawer-input"
				>
					{ADDRESS_LABEL_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>

			<div className="CheckoutDrawer-grid">
				<div className="CheckoutDrawer-field">
					<label htmlFor="governorate" className="CheckoutDrawer-label">
						المحافظة
					</label>
					<input
						id="governorate"
						value={values.governorate}
						onChange={(e) => set("governorate", e.target.value)}
						placeholder="دمشق"
						className="CheckoutDrawer-input"
					/>
				</div>

				<div className="CheckoutDrawer-field">
					<label htmlFor="city" className="CheckoutDrawer-label">
						المدينة / المنطقة
					</label>
					<input
						id="city"
						value={values.city}
						onChange={(e) => set("city", e.target.value)}
						placeholder="المزة"
						className="CheckoutDrawer-input"
					/>
				</div>
			</div>

			<div className="CheckoutDrawer-field">
				<label htmlFor="addressNotes" className="CheckoutDrawer-label">
					ملاحظات (اختياري)
				</label>
				<input
					id="addressNotes"
					value={values.notes}
					onChange={(e) => set("notes", e.target.value)}
					placeholder="رمز الباب 1234"
					className="CheckoutDrawer-input"
				/>
			</div>

			<label className="CheckoutDrawer-checkbox">
				<input
					type="checkbox"
					checked={values.isDefault}
					onChange={(e) => set("isDefault", e.target.checked)}
				/>
				تعيينه كعنواني الافتراضي
			</label>

			{error && (
				<p className="CheckoutDrawer-error" role="alert">
					{error}
				</p>
			)}

			<div className="CheckoutDrawer-panel-actions">
				<button
					type="button"
					onClick={handleSave}
					disabled={saving}
					className="CheckoutDrawer-submit"
				>
					{saving ? "جاري الحفظ…" : "حفظ العنوان"}
				</button>
				<button
					type="button"
					onClick={() => setOpen(false)}
					className="CheckoutDrawer-close"
				>
					إلغاء
				</button>
			</div>
		</div>
	)
}
