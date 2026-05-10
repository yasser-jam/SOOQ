"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import FilterMenu from "@/components/system/filter-menu"
import { useStorePath } from "@/lib/store-path"
import DiscountCodesTable from "@/modules/order/discount-code/components/table"
import { Button } from "@workspace/ui/components/button"
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export default function DiscountCodesPage() {
	const router = useRouter()
	const storePath = useStorePath()

	return (
		<div className="container">
			<div className="my-6 flex justify-between">
				<div className="page-title">أكواد الخصم</div>

				<div className="flex items-center gap-4">
					<FilterMenu>
						<FieldGroup>
							<Field>
								<FieldLabel htmlFor="discount-code-filter">
									الرمز
								</FieldLabel>
								<FieldContent>
									<Input
										id="discount-code-filter"
										type="search"
										placeholder="ابحث عن الرمز"
									/>
								</FieldContent>
							</Field>
						</FieldGroup>
					</FilterMenu>

					<Button
						size="md"
						variant="secondary"
						onClick={() => router.push(storePath("/discount-codes/create"))}
					>
						إضافة كود خصم
						<Plus data-icon="inline-end" />
					</Button>
				</div>
			</div>

			<DiscountCodesTable />
		</div>
	)
}
