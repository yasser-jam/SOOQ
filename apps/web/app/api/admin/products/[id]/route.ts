import { NextResponse } from "next/server"

import { getMockAdminProduct } from "@/modules/product/product/apis/mock-service"
import type { AdminProductInclude } from "@/modules/product/product/types"

const PRODUCT_INCLUDES: AdminProductInclude[] = [
	"PRICING",
	"IMAGES",
	"INVENTORY",
]

interface RouteContext {
	params: Promise<{
		id: string
	}>
}

const parseIncludeParams = (request: Request): AdminProductInclude[] => {
	const { searchParams } = new URL(request.url)

	return searchParams
		.getAll("include")
		.filter((value): value is AdminProductInclude =>
			PRODUCT_INCLUDES.includes(value as AdminProductInclude)
		)
}

export async function GET(request: Request, context: RouteContext) {
	const { id } = await context.params
	const product = getMockAdminProduct(id, parseIncludeParams(request))

	if (!product) {
		return NextResponse.json({ message: "Product not found" }, { status: 404 })
	}

	return NextResponse.json({
		data: product,
	})
}
