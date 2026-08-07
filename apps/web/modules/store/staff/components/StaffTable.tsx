"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import type { ColumnDef } from "@tanstack/react-table"
import {
  Eye,
  MoreVertical,
  Power,
  PowerOff,
  Trash2,
  UserPlus,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import ConfirmAlert from "@/components/system/confirm-alert"
import DataTable from "@/components/system/table"
import {
  getDeactivateStaffMutationOptions,
  getDeleteStaffMutationOptions,
  getReactivateStaffMutationOptions,
  listStaffQueryOptions,
} from "../actions"
import type { StaffResponseDto } from "../types"

const formatDateTime = (value?: string | null): string => {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

const formatDate = (value?: string | null): string => {
  if (!value) return "—"
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function StaffTable() {
  const queryClient = useQueryClient()

  const [page, setPage] = useState(0)
  const [size, setSize] = useState(20)

  const { data, isLoading, isError } = useQuery(
    listStaffQueryOptions({ page, size, sort: "createdAt,desc" })
  )

  const [pendingDelete, setPendingDelete] = useState<StaffResponseDto | null>(
    null
  )
  const [pendingDeactivate, setPendingDeactivate] =
    useState<StaffResponseDto | null>(null)

  const deactivateMutation = useMutation({
    ...getDeactivateStaffMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تعطيل الموظف وإنهاء جلساته")
        setPendingDeactivate(null)
      },
    }),
  })

  const reactivateMutation = useMutation({
    ...getReactivateStaffMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تفعيل الموظف")
      },
    }),
  })

  const deleteMutation = useMutation({
    ...getDeleteStaffMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم حذف الموظف")
        setPendingDelete(null)
      },
    }),
  })

  const columns: ColumnDef<StaffResponseDto>[] = [
    {
      accessorKey: "fullName",
      header: "الاسم",
      cell: ({ row }) => (
        <Link
          href={`/staff/${row.original.staffId}`}
          className="font-medium hover:underline"
        >
          {row.original.fullName}
        </Link>
      ),
    },
    {
      accessorKey: "phone",
      header: "الهاتف",
      cell: ({ row }) => (
        <span dir="ltr" className="font-mono text-sm">
          {row.original.phone}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "الحالة",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="default">نشط</Badge>
        ) : (
          <Badge variant="outline">معطّل</Badge>
        ),
    },
    {
      accessorKey: "lastLoginAt",
      header: "آخر دخول",
      cell: ({ row }) =>
        row.original.lastLoginAt ? formatDateTime(row.original.lastLoginAt) : "أبداً",
    },
    {
      accessorKey: "createdAt",
      header: "أُنشئ في",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const staff = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="إجراءات">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/staff/${staff.staffId}`}>
                  <Eye className="size-4" />
                  عرض / تعديل
                </Link>
              </DropdownMenuItem>
              {staff.isActive ? (
                <DropdownMenuItem
                  onClick={() => setPendingDeactivate(staff)}
                >
                  <PowerOff className="size-4" />
                  تعطيل
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => reactivateMutation.mutate(staff.staffId)}
                  disabled={reactivateMutation.isPending}
                >
                  <Power className="size-4" />
                  تفعيل
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setPendingDelete(staff)}
              >
                <Trash2 className="size-4" />
                حذف
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const items = data?.items ?? []
  const meta = data?.meta

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {meta ? `${meta.total} موظفين` : ""}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(size)}
            onValueChange={(v) => {
              setSize(Number(v))
              setPage(0)
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href={`/staff/new`}>
              <UserPlus className="size-4" />
              إضافة موظف
            </Link>
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          تعذّر تحميل قائمة الموظفين.
        </div>
      ) : (
        <DataTable
          data={items}
          columns={columns}
          isLoading={isLoading}
          pagination={
            meta
              ? {
                  pageIndex: meta.page,
                  pageSize: meta.size,
                  pageCount: meta.totalPages,
                }
              : undefined
          }
          onPageChange={setPage}
          emptyState={
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <p>لا يوجد موظفون بعد.</p>
              <Button asChild variant="outline">
                <Link href={`/staff/new`}>
                  <UserPlus className="size-4" />
                  أضف أول موظف
                </Link>
              </Button>
            </div>
          }
        />
      )}

      <ConfirmAlert
        open={Boolean(pendingDeactivate)}
        onOpenChange={(open) => !open && setPendingDeactivate(null)}
        variant="destructive"
        title="تعطيل الموظف"
        description="سيتم إنهاء جميع جلسات الموظف فوراً ومنعه من تسجيل الدخول."
        actionLabel="تعطيل"
        onAction={() => {
          if (pendingDeactivate) {
            deactivateMutation.mutate(pendingDeactivate.staffId)
          }
        }}
      />

      <ConfirmAlert
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        variant="destructive"
        title="حذف الموظف"
        description={
          pendingDelete
            ? `سيتم حذف الموظف "${pendingDelete.fullName}" بشكل نهائي.`
            : ""
        }
        actionLabel="حذف"
        onAction={() => {
          if (pendingDelete) {
            deleteMutation.mutate(pendingDelete.staffId)
          }
        }}
      />
    </div>
  )
}
