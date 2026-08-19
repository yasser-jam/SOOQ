import type { CategoryRef } from "@/core/config/data-adapter/types"
import { toFullApiUrl } from "@/lib/api"
import publicApi from "@/lib/public-api"
import { getEditorTenantId } from "@/lib/tenant-context"
import type { ApiResponse } from "@/lib/types"

type PublicCategoryListItem = {
	categoryId: string
	slug: string
	nameAr: string
	nameEn?: string
	productCount?: number
	children?: PublicCategoryListItem[]
}

function requireEditorTenantId(): string {
	const tenantId = getEditorTenantId()
	if (!tenantId) {
		throw new Error("Tenant ID is not available for public categories API calls.")
	}
	return tenantId
}

export function getCategoriesApiUrl(): string {
	return toFullApiUrl("/public/categories")
}

function mapCategoryItems(items: PublicCategoryListItem[]): CategoryRef[] {
	return items.map((item) => ({
		id: item.categoryId,
		slug: item.slug,
		nameAr: item.nameAr,
		nameEn: item.nameEn,
		productCount: item.productCount ?? 0,
		children: item.children?.length
			? mapCategoryItems(item.children)
			: undefined,
	}))
}

export async function fetchCategoriesFromUrl(
	apiUrl: string,
): Promise<CategoryRef[]> {
	const tenantId = requireEditorTenantId()
	const response = await publicApi<ApiResponse<PublicCategoryListItem[]>>(
		apiUrl,
		{ tenantId },
	)

	const items = Array.isArray(response.data) ? response.data : []
	return mapCategoryItems(items)
}
