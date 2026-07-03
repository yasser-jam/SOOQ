"use client"

import { useEffect } from "react"

import {
	LOGIN_EVENT,
	type LoginEventDetail,
} from "@/core/config/lib/login-events"

/**
 * Mounts once at the root of the storefront renderer.
 * Listens for the "login" custom event dispatched by ContentButton
 * (with action="login") inside the login popup, and logs the
 * submitted credentials so they can be sent to the auth API.
 */
export function LoginHandler() {
	useEffect(() => {
		const handler = (event: Event) => {
			const detail = (event as CustomEvent<LoginEventDetail>).detail

			console.log("[SOOQ] Login event received:", detail)

			if (detail.email) {
				console.log("[SOOQ] Email:", detail.email)
			}
			if (detail.password) {
				console.log("[SOOQ] Password:", detail.password)
			}
		}

		window.addEventListener(LOGIN_EVENT, handler)
		return () => window.removeEventListener(LOGIN_EVENT, handler)
	}, [])

	return null
}
