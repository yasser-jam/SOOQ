"use client"

import { useEffect, useRef } from "react"

import {
	CREATE_ORDER_EVENT,
	type CreateOrderEventDetail,
} from "@/core/config/cart/make-order"
import { clearCart, readStoreCart } from "@/core/config/cart/store-cart"

import {
	getStoreTenantId,
	submitCheckoutOrderFromCart,
} from "./checkout-api"

/**
 * Mounts once at the root of the storefront renderer.
 * Listens for the "create-order" custom event dispatched by CartSectionClient
 * (and by ContentButton with action="makeOrder"), then submits checkout using
 * cart lines from localStorage and customer info from cookies.
 */
export function MakeOrderHandler() {
	const submittingRef = useRef(false)

	useEffect(() => {
		const handler = async (event: Event) => {
			if (submittingRef.current) return

			const incomingCart = (event as CustomEvent<CreateOrderEventDetail>).detail
				?.cart
			const cart =
				incomingCart && incomingCart.items.length > 0
					? incomingCart
					: readStoreCart()

			if (cart.items.length === 0) {
				window.alert("السلة فارغة. أضف منتجات قبل إتمام الطلب.")
				return
			}

			submittingRef.current = true

			try {
				await submitCheckoutOrderFromCart(cart, getStoreTenantId())
				clearCart()
				window.alert("تم استلام طلبك! سنتواصل معك قريبًا.")
			} catch (err) {
				const msg =
					err instanceof Error ? err.message : "حدث خطأ أثناء تقديم الطلب."
				window.alert(msg)
			} finally {
				submittingRef.current = false
			}
		}

		window.addEventListener(CREATE_ORDER_EVENT, handler)
		return () => window.removeEventListener(CREATE_ORDER_EVENT, handler)
	}, [])

	return null
}
