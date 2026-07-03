"use client"

import { useEffect } from "react"

import {
	LOGIN_EVENT,
	dispatchLoginSuccessEvent,
	type LoginEventDetail,
} from "@/core/config/lib/login-events"
import { openZone } from "@/core/config/lib/zone-events"

export function LoginHandler() {
	useEffect(() => {
		const handler = (event: Event) => {
			const detail = (event as CustomEvent<LoginEventDetail>).detail

			console.log("[SOOQ] Login event received:", detail)

			if (detail.phone) {
				console.log("[SOOQ] Phone:", detail.phone)
			}
			if (detail.fullName) {
				console.log("[SOOQ] Full Name:", detail.fullName)
			}

			dispatchLoginSuccessEvent(detail)
			openZone("verify-otp")
		}

		window.addEventListener(LOGIN_EVENT, handler)
		return () => window.removeEventListener(LOGIN_EVENT, handler)
	}, [])

	return null
}
