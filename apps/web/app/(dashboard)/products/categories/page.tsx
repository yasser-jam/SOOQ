"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import FilterMenu from "@/components/system/filter-menu"
import ProductCategoryTable from "@/modules/product/category/components/table"
import { Button } from "@workspace/ui/components/button"
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export default function ProductsCategoriesPage() {
	const router = useRouter()

	return (
		<div className="container my-6 flex flex-col gap-6">
			<div className="flex justify-between items-center">
				<div className="page-title">فئات المنتجات</div>

				<div className="flex items-center gap-4">
					<FilterMenu>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="category-name-filter">الاسم</FieldLabel>
								<FieldContent>
									<Input
										id="category-name-filter"
										type="search"
										placeholder="ابحث عن الاسم"
									/>
								</FieldContent>
							</Field>
						</FieldGroup>
					</FilterMenu>

					<Button
						size="md"
						variant="secondary"
						onClick={() => router.push("/products/categories/create")}
					>
						إضافة فئة
						<Plus data-icon="inline-end" />
					</Button>
				</div>
			</div>

			<ProductCategoryTable />
		</div>
	)
}
