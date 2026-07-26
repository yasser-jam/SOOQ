"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

import { stripStoreBasePath } from "@/core/config/lib/store-base-path"
import { normalizePagePath } from "@/core/config/page-registry"

export function useStorePathname(): string {
	const pathname = usePathname()

	return useMemo(() => {
		const stripped = stripStoreBasePath(pathname)
		const normalized = normalizePagePath(stripped)
		if (normalized) return normalized
		return stripped === "" ? "/" : stripped
	}, [pathname])
}
