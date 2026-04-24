import { NextRequest, NextResponse } from "next/server"

import { listMockAdminProducts } from "@/modules/product/product/apis/mock-service"
import type {
	ListAdminProductsParams,
	ProductStatus,
} from "@/modules/product/product/types"

const PRODUCT_STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"]

const parseNumberParam = (value: string | null): number | undefined => {
	if (!value) return undefined

	const parsed = Number(value)

	return Number.isFinite(parsed) ? parsed : undefined
}

const parseStatusParam = (value: string | null): ProductStatus | undefined => {
	if (!value) return undefined

	return PRODUCT_STATUSES.includes(value as ProductStatus)
		? (value as ProductStatus)
		: undefined
}

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)

	const params: ListAdminProductsParams = {
		page: parseNumberParam(searchParams.get("page")),
		size: parseNumberParam(searchParams.get("size")),
		sort: searchParams.get("sort") ?? undefined,
		status: parseStatusParam(searchParams.get("status")),
		q: searchParams.get("q") ?? undefined,
	}

	return NextResponse.json({
		data: listMockAdminProducts(params),
	})
}
