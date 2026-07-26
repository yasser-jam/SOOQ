"use client"

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
	boundQueryKeys,
	getEditorDataAdapter,
	type ProductsPageQuery,
} from "@/core/config/data-adapter"
import type {
	ProductsPageActions,
	ProductsPageState,
} from "@/core/config/store-context"

const DEFAULT_PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 250
const CATEGORIES_STALE_TIME = 5 * 60_000

type FilterState = {
	selectedCategorySlug: string | null
	search: string
	page: number
	pageSize: number
}

type FilterAction =
	| { type: "SET_CATEGORY"; slug: string | null }
	| { type: "SET_SEARCH"; search: string }
	| { type: "SET_PAGE"; page: number }
	| { type: "RESET" }
	| { type: "HYDRATE"; state: Partial<FilterState> }

function filterReducer(state: FilterState, action: FilterAction): FilterState {
	switch (action.type) {
		case "SET_CATEGORY":
			return { ...state, selectedCategorySlug: action.slug, page: 1 }
		case "SET_SEARCH":
			return { ...state, search: action.search, page: 1 }
		case "SET_PAGE":
			return { ...state, page: Math.max(1, action.page) }
		case "RESET":
			return {
				selectedCategorySlug: null,
				search: "",
				page: 1,
				pageSize: DEFAULT_PAGE_SIZE,
			}
		case "HYDRATE":
			return { ...state, ...action.state }
		default:
			return state
	}
}

function parseUrlFilters(params: URLSearchParams): Partial<FilterState> {
	const category = params.get("category")
	const search = params.get("search") ?? ""
	const pageRaw = Number(params.get("page") ?? 1)
	const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1

	return {
		selectedCategorySlug: category || null,
		search,
		page,
	}
}

function buildUrlSearchParams(state: FilterState, debouncedSearch: string): string {
	const params = new URLSearchParams()
	if (state.selectedCategorySlug) {
		params.set("category", state.selectedCategorySlug)
	}
	if (debouncedSearch.trim()) {
		params.set("search", debouncedSearch.trim())
	}
	if (state.page > 1) {
		params.set("page", String(state.page))
	}
	return params.toString()
}

export function useProductsPageState(): {
	productsPage: ProductsPageState
	actions: ProductsPageActions
} {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const hydratedRef = useRef(false)
	const urlSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const [filter, dispatch] = useReducer(filterReducer, {
		selectedCategorySlug: null,
		search: "",
		page: 1,
		pageSize: DEFAULT_PAGE_SIZE,
	})

	const [debouncedSearch, setDebouncedSearch] = useReducer(
		(_: string, next: string) => next,
		"",
	)

	useEffect(() => {
		if (hydratedRef.current) return
		hydratedRef.current = true
		dispatch({ type: "HYDRATE", state: parseUrlFilters(searchParams) })
		setDebouncedSearch(searchParams.get("search") ?? "")
	}, [searchParams])

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(filter.search)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(timer)
	}, [filter.search])

	const adapter = getEditorDataAdapter()
	const categoriesUrl = adapter.getCategoriesApiUrl()

	const { data: categories = [], isLoading: categoriesLoading } = useQuery({
		queryKey: boundQueryKeys.categories(),
		queryFn: () => adapter.fetchCategories(categoriesUrl),
		staleTime: CATEGORIES_STALE_TIME,
	})

	// API is 0-based; UI / URL keep 1-based page numbers for the user.
	const productsQuery: ProductsPageQuery = useMemo(
		() => ({
			categorySlug: filter.selectedCategorySlug,
			search: debouncedSearch.trim() || undefined,
			page: Math.max(0, filter.page - 1),
			size: filter.pageSize,
		}),
		[
			filter.selectedCategorySlug,
			debouncedSearch,
			filter.page,
			filter.pageSize,
		],
	)

	const productsApiUrl = adapter.getProductsPageApiUrl(productsQuery)

	const {
		data: productsResult,
		isLoading: productsLoading,
		isError: productsError,
	} = useQuery({
		queryKey: boundQueryKeys.productsPage(productsQuery),
		queryFn: () => adapter.fetchProductsPage(productsApiUrl),
	})

	useEffect(() => {
		if (urlSyncTimerRef.current) {
			clearTimeout(urlSyncTimerRef.current)
		}

		const writeUrl = () => {
			const nextQuery = buildUrlSearchParams(filter, debouncedSearch)
			const currentQuery = searchParams.toString()
			if (nextQuery === currentQuery) return
			const href = nextQuery ? `${pathname}?${nextQuery}` : pathname
			router.replace(href, { scroll: false })
		}

		const delay =
			filter.search !== debouncedSearch ? SEARCH_DEBOUNCE_MS : 0
		urlSyncTimerRef.current = setTimeout(writeUrl, delay)

		return () => {
			if (urlSyncTimerRef.current) {
				clearTimeout(urlSyncTimerRef.current)
			}
		}
	}, [
		filter,
		debouncedSearch,
		pathname,
		router,
		searchParams,
	])

	const setCategory = useCallback((slug: string | null) => {
		dispatch({ type: "SET_CATEGORY", slug })
	}, [])

	const setSearch = useCallback((query: string) => {
		dispatch({ type: "SET_SEARCH", search: query })
	}, [])

	const setPage = useCallback((page: number) => {
		dispatch({ type: "SET_PAGE", page })
	}, [])

	const resetProductsPage = useCallback(() => {
		dispatch({ type: "RESET" })
		setDebouncedSearch("")
	}, [])

	const productsPage: ProductsPageState = {
		categories,
		selectedCategorySlug: filter.selectedCategorySlug,
		search: filter.search,
		page: filter.page,
		pageSize: filter.pageSize,
		totalPages: productsResult?.totalPages ?? 0,
		products: productsResult?.items ?? [],
		isLoading: categoriesLoading || productsLoading,
		isError: productsError,
	}

	return {
		productsPage,
		actions: {
			setCategory,
			setSearch,
			setPage,
			resetProductsPage,
		},
	}
}
