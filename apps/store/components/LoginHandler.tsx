"use client"

import { useEffect } from "react"

import {
	LOGIN_EVENT,
	type LoginEventDetail,
} from "@/core/config/lib/login-events"

const BASE_URL =
	"https://shopengine-production-c68b.up.railway.app"
const TENANT_SLUG = "tmp-4624d73c8f49494cb8be2aedcb967e3a"

async function requestOtp(phone: string, fullName: string) {
	const res = await fetch(`${BASE_URL}/api/v1/customer/auth/otp/request`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			phone,
			tenantSlug: TENANT_SLUG,
			fullName,
		}),
	})

	if (!res.ok) {
		const text = await res.text().catch(() => "")
		throw new Error(`OTP request failed (${res.status}): ${text}`)
	}

	return res.json()
}

export function LoginHandler() {
	useEffect(() => {
		const handler = async (event: Event) => {
			const detail = (event as CustomEvent<LoginEventDetail>).detail

			console.log("[SOOQ] Login event received:", detail)

			const phone = detail.phone ?? ""
			const fullName = detail.fullName ?? ""

			if (!phone) {
				console.warn("[SOOQ] Missing phone number")
				return
			}

			localStorage.setItem("sooq-login-phone", phone)
			localStorage.setItem("sooq-login-fullName", fullName)

			try {
				const data = await requestOtp(phone, fullName)
				console.log("[SOOQ] OTP requested successfully:", data)
			} catch (err) {
				console.error("[SOOQ] OTP request error:", err)
				window.alert("فشل إرسال رمز التحقق. حاول مرة أخرى.")
			}
		}

		window.addEventListener(LOGIN_EVENT, handler)
		return () => window.removeEventListener(LOGIN_EVENT, handler)
	}, [])

	return null
}
