"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Percent, ShipWheel, Tag } from "lucide-react"
import { toast } from "sonner"

import DataTable from "@/components/system/table"
import EmptyState from "@/components/system/empty-state"
import TableActions from "@/components/system/table-actions"
import { formatSyp } from "@/lib/money"
import { useStorePath } from "@/lib/store-path"
import { formatOrderDate } from "@/modules/order/order/utils"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import { deleteDiscountCode, listDiscountCodes } from "../actions"
import {
  DISCOUNT_STATUS_META,
  DISCOUNT_TYPE_LABELS,
  computeDiscountCodeStatus,
} from "../model"
import { discountCodeQueryKeys } from "../queryKeys"
import type { DiscountCode, DiscountType } from "../types"

const TYPE_ICON: Record<DiscountType, typeof Tag> = {
  PERCENTAGE: Percent,
  FIXED_AMOUNT: Tag,
  FREE_SHIPPING: ShipWheel,
}

const formatDiscountValue = (
  type: DiscountType,
  value: number,
  cap?: number | null
): string => {
  if (type === "PERCENTAGE") {
    const base = `${value}%`
    return cap ? `${base} (حدّ أقصى ${formatSyp(cap)})` : base
  }

  if (type === "FIXED_AMOUNT") {
    return formatSyp(value)
  }

  return "—"
}

export default function DiscountCodesTable() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const { data: codes, isPending } = useQuery({
    queryKey: discountCodeQueryKeys.all,
    queryFn: listDiscountCodes,
  })

  const { mutate: removeCode } = useMutation({
    mutationFn: deleteDiscountCode,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: discountCodeQueryKeys.all })
      queryClient.removeQueries({
        queryKey: discountCodeQueryKeys.detail(id),
      })
      toast.success("تم حذف كود الخصم")
    },
  })

  const columns: ColumnDef<DiscountCode>[] = [
    {
      accessorKey: "code",
      header: "الرمز",
      cell: ({ row }) => {
        const Icon = TYPE_ICON[row.original.discountType]

        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                <Icon size="18" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5">
              <span className="font-mono font-semibold text-foreground">
                {row.original.code}
              </span>
              <span className="text-xs text-muted-foreground">
                {DISCOUNT_TYPE_LABELS[row.original.discountType]}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "discountValue",
      header: "القيمة",
      cell: ({ row }) => (
        <span className="font-medium">
          {formatDiscountValue(
            row.original.discountType,
            row.original.discountValue,
            row.original.maxDiscountCap
          )}
        </span>
      ),
    },
    {
      accessorKey: "currentUses",
      header: "الاستخدامات",
      cell: ({ row }) => {
        const used = row.original.currentUses ?? 0
        const limit = row.original.usageLimit
        const ratio = limit ? Math.min(1, used / limit) : 0

        return (
          <div className="flex min-w-32 flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {used} {limit ? `/ ${limit}` : "(غير محدود)"}
            </span>
            {limit ? (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${ratio * 100}%` }}
                />
              </div>
            ) : null}
          </div>
        )
      },
    },
    {
      accessorKey: "expiresAt",
      header: "الانتهاء",
      cell: ({ row }) => <span>{formatOrderDate(row.original.expiresAt)}</span>,
    },
    {
      accessorKey: "isActive",
      header: "الحالة",
      cell: ({ row }) => {
        const status = computeDiscountCodeStatus(
          row.original.startsAt,
          row.original.expiresAt,
          row.original.isActive
        )
        const meta = DISCOUNT_STATUS_META[status]

        return <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
      },
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => <div></div>,
      cell: ({ row }) => {
        const id = row.original.id

        return (
          <TableActions
            onUpdate={() => {
              if (!id) return
              router.push(storePath(`/discount-codes/${id}`))
            }}
            onDelete={() => {
              if (!id) return
              removeCode(id)
            }}
          />
        )
      },
    },
  ]

  const pageSize = 10
  const [pageIndex, setPageIndex] = useState(0)
  const totalCount = codes?.length ?? 0
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1))
  }, [pageCount])

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <DataTable
        columns={columns}
        isLoading={isPending}
        data={codes ?? []}
        pagination={{ pageIndex, pageSize, pageCount }}
        onPageChange={setPageIndex}
        emptyState={
          <EmptyState
            icon={<Tag className="size-8" />}
            title="لا توجد أكواد خصم"
            description="أنشئ أكواد خصم ليمنح عملاؤك تخفيضات على الطلبات."
            cta={{
              label: "إضافة كود خصم",
              onClick: () =>
                router.push(storePath("/discount-codes/create")),
            }}
          />
        }
      />
    </div>
  )
}
