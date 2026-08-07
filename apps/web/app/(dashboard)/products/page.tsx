'use client'

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import FilterMenu from "@/components/system/filter-menu"
import { useStorePath } from "@/lib/store-path"
import ProductTable from "@/modules/product/product/components/table"
import { Button } from "@workspace/ui/components/button"
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export default function ProductsPage() {
	const router = useRouter()
	const storePath = useStorePath()

	return (
		<div className="container">
			<div className="my-6 flex justify-between">
				<div className="page-title">المنتجات</div>

				<div className="flex items-center gap-4">
					<FilterMenu>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="product-name-filter">الاسم</FieldLabel>
								<FieldContent>
									<Input
										id="product-name-filter"
										type="search"
										placeholder="ابحث عن المنتج"
									/>
								</FieldContent>
							</Field>
						</FieldGroup>
					</FilterMenu>

					<Button size="md" variant="secondary" onClick={() => router.push(storePath('/products/create'))}>
						إضافة منتج
						<Plus data-icon="inline-end" />
					</Button>
				</div>
			</div>

			<ProductTable />
		</div>
	)
}
