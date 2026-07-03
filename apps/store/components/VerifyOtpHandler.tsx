"use client"

import { useEffect } from "react"

import {
	VERIFY_OTP_EVENT,
	type LoginEventDetail,
} from "@/core/config/lib/login-events"
import { closeZone } from "@/core/config/lib/zone-events"

export function VerifyOtpHandler() {
	useEffect(() => {
		const handler = (event: Event) => {
			const detail = (event as CustomEvent<LoginEventDetail>).detail

			console.log("[SOOQ] Verify OTP event received:", detail)

			if (detail.otp) {
				console.log("[SOOQ] OTP:", detail.otp)
			}

			closeZone("verify-otp")
		}

		window.addEventListener(VERIFY_OTP_EVENT, handler)
		return () => window.removeEventListener(VERIFY_OTP_EVENT, handler)
	}, [])

	return null
}
