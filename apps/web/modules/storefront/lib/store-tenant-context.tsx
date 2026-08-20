"use client"

import {
	createContext,
	useContext,
	useLayoutEffect,
	useMemo,
	type ReactNode,
} from "react"

import { setStoreBasePath } from "@/core/config/lib/store-base-path"
import { setTenantIdOverride } from "@/lib/tenant-context"

import { buildStoreBasePath } from "@/modules/storefront/lib/store-config"

type StoreTenantContextValue = {
	tenantId: string
	storeSlug: string
	basePath: string
}

const StoreTenantContext = createContext<StoreTenantContextValue | null>(null)

type StoreTenantProviderProps = {
	tenantId: string
	storeSlug?: string
	/** Overrides the `/store/:slug`-derived base path — used by contexts that
	 *  aren't keyed by a public store slug (e.g. the admin draft preview). */
	basePath?: string
	children: ReactNode
}

export function StoreTenantProvider({
	tenantId,
	storeSlug = "",
	basePath,
	children,
}: StoreTenantProviderProps) {
	const value = useMemo(
		() => ({
			tenantId,
			storeSlug,
			basePath: basePath ?? buildStoreBasePath(storeSlug),
		}),
		[tenantId, storeSlug, basePath],
	)

	setTenantIdOverride(tenantId)
	setStoreBasePath(value.basePath)

	useLayoutEffect(() => {
		setTenantIdOverride(tenantId)
		setStoreBasePath(value.basePath)

		return () => {
			setTenantIdOverride(null)
			setStoreBasePath(null)
		}
	}, [tenantId, value.basePath])

	return (
		<StoreTenantContext.Provider value={value}>
			{children}
		</StoreTenantContext.Provider>
	)
}

export function useStoreTenant(): StoreTenantContextValue {
	const context = useContext(StoreTenantContext)
	if (!context) {
		throw new Error("useStoreTenant must be used within StoreTenantProvider")
	}
	return context
}
