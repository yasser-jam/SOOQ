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
	minPrice: number | null
	maxPrice: number | null
	inStockOnly: boolean
	page: number
	pageSize: number
}

/** The typed-into filters — debounced before they reach the API and the URL. */
type DebouncedFilters = {
	search: string
	minPrice: number | null
	maxPrice: number | null
}

const INITIAL_FILTER: FilterState = {
	selectedCategorySlug: null,
	search: "",
	minPrice: null,
	maxPrice: null,
	inStockOnly: false,
	page: 1,
	pageSize: DEFAULT_PAGE_SIZE,
}

type FilterAction =
	| { type: "SET_CATEGORY"; slug: string | null }
	| { type: "SET_SEARCH"; search: string }
	| { type: "SET_MIN_PRICE"; value: number | null }
	| { type: "SET_MAX_PRICE"; value: number | null }
	| { type: "SET_IN_STOCK_ONLY"; value: boolean }
	| { type: "SET_PAGE"; page: number }
	| { type: "RESET" }
	| { type: "HYDRATE"; state: Partial<FilterState> }

function filterReducer(state: FilterState, action: FilterAction): FilterState {
	switch (action.type) {
		// Every filter change resets paging — page N of the old result set is
		// meaningless against the new one.
		case "SET_CATEGORY":
			return { ...state, selectedCategorySlug: action.slug, page: 1 }
		case "SET_SEARCH":
			return { ...state, search: action.search, page: 1 }
		case "SET_MIN_PRICE":
			return { ...state, minPrice: action.value, page: 1 }
		case "SET_MAX_PRICE":
			return { ...state, maxPrice: action.value, page: 1 }
		case "SET_IN_STOCK_ONLY":
			return { ...state, inStockOnly: action.value, page: 1 }
		case "SET_PAGE":
			return { ...state, page: Math.max(1, action.page) }
		case "RESET":
			return INITIAL_FILTER
		case "HYDRATE":
			return { ...state, ...action.state }
		default:
			return state
	}
}

function parsePositiveNumber(raw: string | null): number | null {
	if (raw == null || raw.trim() === "") return null
	const parsed = Number(raw)
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseUrlFilters(params: URLSearchParams): Partial<FilterState> {
	const category = params.get("category")
	const search = params.get("q") ?? ""
	const pageRaw = Number(params.get("page") ?? 1)
	const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1

	return {
		selectedCategorySlug: category || null,
		search,
		minPrice: parsePositiveNumber(params.get("minPrice")),
		maxPrice: parsePositiveNumber(params.get("maxPrice")),
		inStockOnly: params.get("inStock") === "true",
		page,
	}
}

function buildUrlSearchParams(
	state: FilterState,
	debounced: DebouncedFilters,
): string {
	const params = new URLSearchParams()
	if (state.selectedCategorySlug) {
		params.set("category", state.selectedCategorySlug)
	}
	if (debounced.search.trim()) {
		params.set("q", debounced.search.trim())
	}
	if (debounced.minPrice != null) {
		params.set("minPrice", String(debounced.minPrice))
	}
	if (debounced.maxPrice != null) {
		params.set("maxPrice", String(debounced.maxPrice))
	}
	if (state.inStockOnly) {
		params.set("inStock", "true")
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

	const [filter, dispatch] = useReducer(filterReducer, INITIAL_FILTER)

	const [debounced, setDebounced] = useReducer(
		(_: DebouncedFilters, next: DebouncedFilters) => next,
		{ search: "", minPrice: null, maxPrice: null },
	)

	useEffect(() => {
		if (hydratedRef.current) return
		hydratedRef.current = true
		const hydrated = parseUrlFilters(searchParams)
		dispatch({ type: "HYDRATE", state: hydrated })
		setDebounced({
			search: hydrated.search ?? "",
			minPrice: hydrated.minPrice ?? null,
			maxPrice: hydrated.maxPrice ?? null,
		})
	}, [searchParams])

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebounced({
				search: filter.search,
				minPrice: filter.minPrice,
				maxPrice: filter.maxPrice,
			})
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(timer)
	}, [filter.search, filter.minPrice, filter.maxPrice])

	const isDebouncePending =
		filter.search !== debounced.search ||
		filter.minPrice !== debounced.minPrice ||
		filter.maxPrice !== debounced.maxPrice

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
			search: debounced.search.trim() || undefined,
			minPrice: debounced.minPrice,
			maxPrice: debounced.maxPrice,
			inStockOnly: filter.inStockOnly,
			page: Math.max(0, filter.page - 1),
			size: filter.pageSize,
		}),
		[
			filter.selectedCategorySlug,
			filter.inStockOnly,
			debounced.search,
			debounced.minPrice,
			debounced.maxPrice,
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
			const nextQuery = buildUrlSearchParams(filter, debounced)
			const currentQuery = searchParams.toString()
			if (nextQuery === currentQuery) return
			const href = nextQuery ? `${pathname}?${nextQuery}` : pathname
			router.replace(href, { scroll: false })
		}

		const delay = isDebouncePending ? SEARCH_DEBOUNCE_MS : 0
		urlSyncTimerRef.current = setTimeout(writeUrl, delay)

		return () => {
			if (urlSyncTimerRef.current) {
				clearTimeout(urlSyncTimerRef.current)
			}
		}
	}, [
		filter,
		debounced,
		isDebouncePending,
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

	const setMinPrice = useCallback((value: number | null) => {
		dispatch({ type: "SET_MIN_PRICE", value })
	}, [])

	const setMaxPrice = useCallback((value: number | null) => {
		dispatch({ type: "SET_MAX_PRICE", value })
	}, [])

	const setInStockOnly = useCallback((value: boolean) => {
		dispatch({ type: "SET_IN_STOCK_ONLY", value })
	}, [])

	const setPage = useCallback((page: number) => {
		dispatch({ type: "SET_PAGE", page })
	}, [])

	const resetProductsPage = useCallback(() => {
		dispatch({ type: "RESET" })
		setDebounced({ search: "", minPrice: null, maxPrice: null })
	}, [])

	const productsPage: ProductsPageState = {
		categories,
		selectedCategorySlug: filter.selectedCategorySlug,
		search: filter.search,
		minPrice: filter.minPrice,
		maxPrice: filter.maxPrice,
		inStockOnly: filter.inStockOnly,
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
			setMinPrice,
			setMaxPrice,
			setInStockOnly,
			setPage,
			resetProductsPage,
		},
	}
}
