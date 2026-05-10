"use client"

import { useEffect, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import TableActions from "@/components/system/table-actions"
import DataTable from "@/components/system/table"
import { useStorePath } from "@/lib/store-path"
import { Badge } from "@workspace/ui/components/badge"

import type { ShippingProvider } from "../types"
import { deleteShippingProvider, listShippingProviders } from "../actions"
import { shippingProviderQueryKeys } from "../queryKeys"

export default function ProvidersTable() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const { data: providers, isPending } = useQuery({
    queryKey: shippingProviderQueryKeys.all,
    queryFn: listShippingProviders,
  })

  const { mutate: remove } = useMutation({
    mutationFn: deleteShippingProvider,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: shippingProviderQueryKeys.all })
    },
  })

  const columns: ColumnDef<ShippingProvider>[] = [
    {
      accessorKey: "providerName",
      header: "الاسم",
      cell: ({ row }) => {
        const provider = row.original

        return (
          <div className="flex flex-col gap-0.5">
            <span>{provider.providerName}</span>
            <span className="text-xs text-muted-foreground">
              {provider.providerCode}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: "priority",
      header: "الأولوية",
      cell: ({ row }) => <span>{row.original.priority ?? "-"}</span>,
    },
    {
      id: "status",
      header: "الحالة",
      cell: ({ row }) => {
        const isActive = row.original.isActive ?? true
        return (
          <Badge variant={isActive ? "secondary-tonal" : "destructive"}>
            {isActive ? "مفعل" : "معطل"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div />,
      cell: ({ row }) => {
        const id = row.original.id

        return (
          <TableActions
            onUpdate={() => {
              if (!id) return
              router.push(storePath(`/logistics/shipping/providers/${id}`))
            }}
            onDelete={() => {
              if (!id) return
              remove(id)
            }}
          />
        )
      },
    },
  ]

  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = providers?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={providers || []}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
      />
    </div>
  )
}
