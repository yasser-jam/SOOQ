"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

import { normalizePagePath } from "@/core/config/page-registry"

export function useStorePathname(): string {
	const pathname = usePathname()

	return useMemo(() => {
		const normalized = normalizePagePath(pathname)
		if (normalized) return normalized
		return pathname === "" ? "/" : pathname
	}, [pathname])
}
