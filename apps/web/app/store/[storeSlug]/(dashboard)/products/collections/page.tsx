"use client"

import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import FilterMenu from "@/components/system/filter-menu"
import { useStorePath } from "@/lib/store-path"
import ProductCollectionTable from "@/modules/product/collection/components/table"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"

export default function ProductsCollectionsPage() {
  const router = useRouter()
  const storePath = useStorePath()

  return (
    <div className="container">
      <div className="my-6 flex justify-between">
        <div className="page-title">مجموعات المنتجات</div>

        <div className="flex items-center gap-4">
          <FilterMenu>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="collection-name-filter">الاسم</FieldLabel>
                <FieldContent>
                  <Input
                    id="collection-name-filter"
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
            onClick={() =>
              router.push(storePath("/products/collections/create"))
            }
          >
            إضافة مجموعة
            <Plus data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <ProductCollectionTable />
    </div>
  )
}
