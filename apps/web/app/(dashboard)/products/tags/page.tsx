'use client'
import ProductTagTable from "@/modules/product/tag/components/table"
import FilterMenu from "@/components/system/filter-menu"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProductsTagsPage() {

  const router = useRouter()

  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="page-title">وسوم المنتجات</div>

        <div className="flex items-center gap-4">
          <FilterMenu>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="tag-name-filter">الاسم</FieldLabel>
                <FieldContent>
                  <Input
                    id="tag-name-filter"
                    type="search"
                    placeholder="ابحث عن الاسم"
                  />
                </FieldContent>
              </Field>
            </FieldGroup>
          </FilterMenu>

          <Button size="md" variant="secondary" onClick={() => router.push('/products/tags/create')}>
            إضافة وسم
            <Plus data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <ProductTagTable />
    </div>
  )
}
