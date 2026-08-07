"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { AlertTriangle, Power, PowerOff, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import ConfirmAlert from "@/components/system/confirm-alert"
import {
  getDeactivateStaffMutationOptions,
  getDeleteStaffMutationOptions,
  getReactivateStaffMutationOptions,
  getStaffQueryOptions,
} from "../actions"

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

export default function StaffDetailView({
  staffId,
}: {
  staffId: string
}) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data, isLoading, isError } = useQuery(getStaffQueryOptions(staffId))

  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const deactivate = useMutation({
    ...getDeactivateStaffMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تعطيل الموظف وإنهاء جلساته")
        setConfirmDeactivate(false)
      },
    }),
  })

  const reactivate = useMutation({
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
        router.push(`/staff`)
      },
    }),
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          تعذّر تحميل بيانات الموظف. قد يكون محذوفاً.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle dir="auto">{data.fullName}</CardTitle>
              <CardDescription dir="ltr" className="font-mono">
                {data.phone}
              </CardDescription>
            </div>
            {data.isActive ? (
              <Badge variant="default">نشط</Badge>
            ) : (
              <Badge variant="outline">معطّل</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <div>
            <p className="text-muted-foreground">آخر دخول</p>
            <p>
              {data.lastLoginAt ? formatDateTime(data.lastLoginAt) : "أبداً"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">أُنشئ في</p>
            <p>{formatDateTime(data.createdAt)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">آخر تحديث</p>
            <p>{formatDateTime(data.updatedAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الصلاحيات</CardTitle>
          <CardDescription>
            يحصل دور <strong>STAFF</strong> على مجموعة صلاحيات ثابتة محدّدة من
            النظام (قراءة المنتجات والمخزون والطلبات والشحن). لا يمكن تخصيصها
            لكل موظف.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            <CardTitle>منطقة الخطر</CardTitle>
          </div>
          <CardDescription>
            التعطيل ينهي جلسات الموظف فوراً. الحذف لا يمكن التراجع عنه.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap justify-end gap-2">
          {data.isActive ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeactivate(true)}
            >
              <PowerOff className="size-4" />
              تعطيل
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              loading={reactivate.isPending}
              onClick={() => reactivate.mutate(staffId)}
            >
              <Power className="size-4" />
              تفعيل
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="size-4" />
            حذف نهائي
          </Button>
        </CardFooter>
      </Card>

      <ConfirmAlert
        open={confirmDeactivate}
        onOpenChange={setConfirmDeactivate}
        variant="destructive"
        title="تعطيل الموظف"
        description="سيتم إنهاء جميع جلسات الموظف فوراً ومنعه من تسجيل الدخول."
        actionLabel="تعطيل"
        onAction={() => deactivate.mutate(staffId)}
      />

      <ConfirmAlert
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title="حذف الموظف"
        description={`سيتم حذف "${data.fullName}" بشكل نهائي. لا يمكن التراجع.`}
        actionLabel="حذف"
        onAction={() => deleteMutation.mutate(staffId)}
      />
    </div>
  )
}
