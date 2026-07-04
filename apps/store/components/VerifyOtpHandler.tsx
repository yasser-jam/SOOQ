"use client"

import { useEffect } from "react"

import {
	VERIFY_OTP_EVENT,
	type LoginEventDetail,
} from "@/core/config/lib/login-events"

const BASE_URL =
	"https://shopengine-production-c68b.up.railway.app"
const TENANT_SLUG = "tmp-4624d73c8f49494cb8be2aedcb967e3a"

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

function setCookie(name: string, value: string) {
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

async function verifyOtp(phone: string, otpCode: string) {
	const res = await fetch(`${BASE_URL}/api/v1/customer/auth/otp/verify`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			phone,
			tenantSlug: TENANT_SLUG,
			otpCode,
		}),
	})

	if (!res.ok) {
		const text = await res.text().catch(() => "")
		throw new Error(`OTP verify failed (${res.status}): ${text}`)
	}

	return res.json()
}

export function VerifyOtpHandler() {
	useEffect(() => {
		const handler = async (event: Event) => {
			const detail = (event as CustomEvent<LoginEventDetail>).detail

			console.log("[SOOQ] Verify OTP event received:", detail)

			const otpCode = detail.otp ?? ""
			const phone = localStorage.getItem("sooq-login-phone") ?? ""
			const fullName = localStorage.getItem("sooq-login-fullName") ?? ""

			if (!otpCode || !phone) {
				console.warn("[SOOQ] Missing OTP or phone")
				return
			}

			try {
				const data = await verifyOtp(phone, otpCode)
				console.log("[SOOQ] OTP verified successfully:", data)

				const tenantId = data?.tenantId ?? data?.tenant_id ?? TENANT_SLUG
				setCookie("sooq-tenant-id", tenantId)
				setCookie("sooq-user-name", fullName)
				setCookie("sooq-user-phone", phone)

				localStorage.removeItem("sooq-login-phone")
				localStorage.removeItem("sooq-login-fullName")

				window.location.href = "/"
			} catch (err) {
				console.error("[SOOQ] OTP verify error:", err)
				window.alert("رمز التحقق غير صحيح. حاول مرة أخرى.")
			}
		}

		window.addEventListener(VERIFY_OTP_EVENT, handler)
		return () => window.removeEventListener(VERIFY_OTP_EVENT, handler)
	}, [])

	return null
}
