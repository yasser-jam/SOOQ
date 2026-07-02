"use client"

import { useEffect, useState } from "react"

import {
	MAKE_ORDER_EVENT,
	type MakeOrderEventDetail,
} from "@/core/config/cart/make-order"
import type { StoreCart } from "@/core/config/cart/store-cart"

import { CheckoutDrawer } from "./CheckoutDrawer"
import { getStoreTenantId } from "./checkout-api"

/**
 * Mounts once at the root of the storefront renderer.
 * Listens for the "make-order" custom event dispatched by CartSectionClient
 * (and by ContentButton with action="makeOrder"), then opens the checkout
 * drawer with the current cart snapshot and the tenant UUID from cookie.
 *
 * Renders no visible DOM on its own — only the <CheckoutDrawer /> portal.
 */
export function MakeOrderHandler() {
	const [open, setOpen] = useState(false)
	const [cart, setCart] = useState<StoreCart | null>(null)
	const [tenantId, setTenantId] = useState<string | null>(null)

	useEffect(() => {
		const handler = (event: Event) => {
			const { cart: incomingCart } = (
				event as CustomEvent<MakeOrderEventDetail>
			).detail

			if (!incomingCart || incomingCart.items.length === 0) return

			// Read the cookie fresh each time the order dialog opens
			setTenantId(getStoreTenantId())
			setCart(incomingCart)
			setOpen(true)
		}

		window.addEventListener(MAKE_ORDER_EVENT, handler)
		return () => window.removeEventListener(MAKE_ORDER_EVENT, handler)
	}, [])

	return (
		<CheckoutDrawer
			open={open}
			onClose={() => setOpen(false)}
			cart={cart}
			tenantId={tenantId}
		/>
	)
}
