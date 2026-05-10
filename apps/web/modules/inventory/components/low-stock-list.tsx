"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle, ExternalLink } from "lucide-react"

import DataTable from "@/components/system/table"
import { useStorePath } from "@/lib/store-path"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

import { getLowStockVariants } from "@/modules/inventory/actions"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"
import type { LowStockVariant } from "@/modules/inventory/types"

type Props = {
  /** When omitted, shows a productId input + empty state */
  productId?: string
}

export default function LowStockList({ productId: defaultProductId }: Props) {
  const storePath = useStorePath()
  const [productId, setProductId] = useState(defaultProductId ?? "")

  const { data, isPending, isFetching, refetch } = useQuery({
    queryKey: inventoryQueryKeys.lowStock(productId),
    queryFn: () => getLowStockVariants(productId),
    enabled: Boolean(productId),
  })

  const columns: ColumnDef<LowStockVariant>[] = useMemo(
    () => [
      {
        accessorKey: "sku",
        header: "SKU",
        cell: ({ row }) => (
          <span dir="ltr" className="font-mono">
            {row.original.sku}
          </span>
        ),
      },
      {
        accessorKey: "stockQty",
        header: "المخزون الحالي",
        cell: ({ row }) => (
          <Badge
            variant={row.original.stockQty === 0 ? "destructive" : "secondary"}
          >
            {row.original.stockQty}
          </Badge>
        ),
      },
      {
        accessorKey: "lowStockThreshold",
        header: "حدّ التنبيه",
        cell: ({ row }) => row.original.lowStockThreshold ?? "—",
      },
      {
        id: "delta",
        header: "النقص",
        cell: ({ row }) => {
          const t = row.original.lowStockThreshold ?? 0
          const diff = t - row.original.stockQty
          return (
            <span className="text-destructive font-medium">
              {diff > 0 ? `-${diff}` : ""}
            </span>
          )
        },
      },
    ],
    []
  )

  const pageSize = 20
  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = data?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((p) => Math.min(p, pageCount - 1))
  }, [pageCount])

  return (
    <div className="flex flex-col gap-4">
      {!defaultProductId ? (
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            refetch()
          }}
        >
          <div className="flex-1">
            <label
              htmlFor="lowstock-product-id"
              className="text-sm font-medium block mb-1"
            >
              رقم المنتج
            </label>
            <Input
              id="lowstock-product-id"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="أدخل productId للبحث"
              dir="ltr"
            />
          </div>
          <Button type="submit" disabled={!productId || isFetching}>
            بحث
          </Button>
        </form>
      ) : null}

      {!productId ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <AlertTriangle className="size-10 text-muted-foreground mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">
            اختر منتجاً لعرض متغيّراته منخفضة المخزون.
          </p>
        </div>
      ) : data && data.length === 0 && !isPending ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            ✓ كل متغيّرات هذا المنتج فوق حدّ التنبيه.
          </p>
          <Button variant="ghost" asChild className="mt-2">
            <Link href={storePath(`/products/${productId}/inventory`)}>
              فتح صفحة المخزون
              <ExternalLink className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <DataTable
            columns={columns}
            isLoading={isPending}
            data={data ?? []}
            pagination={{ pageIndex, pageSize, pageCount }}
            onPageChange={setPageIndex}
          />
        </div>
      )}
    </div>
  )
}
