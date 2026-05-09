"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Boxes } from "lucide-react"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import EmptyState from "@/components/system/empty-state"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import {
  attributeQueryKeys,
  deleteAttributeDefinition,
  listAttributeDefinitions,
} from "../actions"
import type { ProductAttributeDefinition } from "../types"

const dataTypeLabels: Record<string, string> = {
  TEXT: "نص",
  NUMBER: "رقم",
  BOOLEAN: "صح/خطأ",
  SELECT: "اختيار",
  MULTI_SELECT: "متعدّد",
}

type Props = {
  categoryId?: string | null
}

export default function AttributeTable({ categoryId }: Props) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: attributes, isPending } = useQuery({
    queryKey: attributeQueryKeys.list(categoryId ?? null),
    queryFn: () => listAttributeDefinitions(categoryId ?? null),
  })

  const { mutate: removeAttribute } = useMutation({
    mutationFn: deleteAttributeDefinition,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: attributeQueryKeys.all })
      queryClient.removeQueries({ queryKey: attributeQueryKeys.detail(id) })
    },
  })

  const columns: ColumnDef<ProductAttributeDefinition>[] = [
    {
      accessorKey: "attributeNameAr",
      enableSorting: true,
      header: "الاسم",
      cell: ({ row }) => {
        const attr = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                <Boxes size="18" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{attr.attributeNameAr}</span>
              <span className="text-xs text-muted-foreground" dir="ltr">
                {attr.attributeKey}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "dataType",
      header: "النوع",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {dataTypeLabels[row.original.dataType] ?? row.original.dataType}
        </Badge>
      ),
    },
    {
      id: "scope",
      header: "النطاق",
      cell: ({ row }) =>
        row.original.categoryId ? (
          <Badge variant="outline">حسب الفئة</Badge>
        ) : (
          <Badge>على المتجر</Badge>
        ),
    },
    {
      id: "flags",
      header: "خصائص",
      cell: ({ row }) => {
        const attr = row.original
        return (
          <div className="flex flex-wrap gap-1">
            {attr.isRequired ? <Badge variant="outline">إلزامي</Badge> : null}
            {attr.isFilterable ? <Badge variant="outline">فلتر</Badge> : null}
            {attr.isVisibleOnStorefront ? (
              <Badge variant="outline">مرئي</Badge>
            ) : null}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div></div>,
      cell: (attr) => {
        const id = attr.row.original.attributeDefId
        if (!id) return null
        return (
          <TableActions
            onUpdate={() => {
              router.push(`/products/attributes/${id}`)
            }}
            onDelete={() => {
              removeAttribute(id)
            }}
          />
        )
      },
    },
  ]

  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = attributes?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={attributes ?? []}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
        emptyState={
          <EmptyState
            icon={<Boxes className="size-8" />}
            title="لا توجد سمات بعد"
            description="عرّف سمات مخصّصة (لون، مادة، ضمان...) لاستخدامها في الفلاتر."
            cta={{
              label: "إضافة سمة",
              onClick: () => router.push("/products/attributes/create"),
            }}
          />
        }
      />
    </div>
  )
}
