"use client"

import { useCallback, useState } from "react"

import type { SiteData } from "@/core/config/lib/site-data"
import {
	getSiteStorageKey,
	readSiteData,
	writeSiteData,
} from "@/core/config/lib/site-data"

export function ThemeJsonTester() {
	const [open, setOpen] = useState(false)
	const [value, setValue] = useState("")
	const [error, setError] = useState<string | null>(null)
	const [saved, setSaved] = useState(false)

	const handleOpen = useCallback(() => {
		setOpen((prev) => {
			if (!prev) {
				try {
					const site = readSiteData()
					setValue(JSON.stringify(site, null, 2))
					setError(null)
					setSaved(false)
				} catch {
					setValue("")
				}
			}
			return !prev
		})
	}, [])

	const handleSave = useCallback(() => {
		setError(null)
		setSaved(false)

		try {
			const parsed = JSON.parse(value) as SiteData
			writeSiteData(parsed)
			setSaved(true)
		} catch (err) {
			setError(err instanceof Error ? err.message : "JSON غير صالح")
		}
	}, [value])

	return (
		<div className="ThemeJsonTester">
			<button
				type="button"
				className="ThemeJsonTester-toggle"
				onClick={handleOpen}
				aria-expanded={open}
			>
				{open ? "إغلاق" : "اختبار JSON"}
			</button>

			{open ? (
				<div className="ThemeJsonTester-panel">
					<p className="ThemeJsonTester-hint">
						الصق بيانات الموقع (SiteData) من استوديو التصميم ثم احفظ في
						localStorage — المفتاح: <code>{getSiteStorageKey()}</code>
					</p>
					<textarea
						className="ThemeJsonTester-textarea"
						value={value}
						onChange={(e) => {
							setValue(e.target.value)
							setSaved(false)
							setError(null)
						}}
						spellCheck={false}
					/>
					<div className="ThemeJsonTester-actions">
						<button
							type="button"
							className="ThemeJsonTester-save"
							onClick={handleSave}
						>
							حفظ وعرض
						</button>
						{saved ? (
							<span className="ThemeJsonTester-success">تم الحفظ</span>
						) : null}
						{error ? (
							<span className="ThemeJsonTester-error">{error}</span>
						) : null}
					</div>
				</div>
			) : null}
		</div>
	)
}
