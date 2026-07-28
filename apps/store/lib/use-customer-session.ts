"use client"

import { useSyncExternalStore } from "react"

import { hasCustomerSession } from "./customer-orders-api"

const subscribe = () => () => {}
const getServerSnapshot = () => null

/**
 * `null` until the client has hydrated — the access-token cookie is invisible
 * during SSR, so rendering "sign in first" before mount would flash for a
 * logged-in customer.
 */
export function useCustomerSession(): boolean | null {
	return useSyncExternalStore(subscribe, hasCustomerSession, getServerSnapshot)
}
