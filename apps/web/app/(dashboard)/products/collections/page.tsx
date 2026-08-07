"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"

import FilterMenu from "@/components/system/filter-menu"
import { useStorePath } from "@/lib/store-path"
import CreateCollectionTypeDialog from "@/modules/product/collection/components/create-collection-type-dialog"
import ProductCollectionGrid from "@/modules/product/collection/components/collection-grid"
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
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)

  const navigateToCreate = (type: "manual" | "automated") => {
    setTypeDialogOpen(false)
    router.push(storePath(`/products/collections/create?type=${type}`))
  }

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
            onClick={() => setTypeDialogOpen(true)}
          >
            إضافة مجموعة
            <Plus data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <ProductCollectionGrid />

      <CreateCollectionTypeDialog
        open={typeDialogOpen}
        onOpenChange={setTypeDialogOpen}
        onSelectManual={() => navigateToCreate("manual")}
        onSelectAutomated={() => navigateToCreate("automated")}
      />
    </div>
  )
}
