"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Textarea } from "@workspace/ui/components/textarea"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getUpdateStatusMutationOptions } from "../actions"
import { STORE_STATUS_LABELS } from "../init"
import { updateStoreStatusSchema } from "../schema"
import type { StoreStatus, TenantSummary, UpdateStoreStatusInput } from "../types"

type UpdateStatusDialogProps = {
  tenant: TenantSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateStatusDialog({
  tenant,
  open,
  onOpenChange,
}: UpdateStatusDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateStoreStatusInput>({
    resolver: zodResolver(updateStoreStatusSchema),
    defaultValues: {
      status: tenant?.storeStatus ?? "ACTIVE",
      maintenanceMessage: tenant?.maintenanceMessage ?? "",
      storePassword: "",
    },
  })

  const { mutate, isPending } = useMutation({
    ...getUpdateStatusMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث حالة المتجر")
        onOpenChange(false)
      },
    }),
  })

  const status = form.watch("status")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>تغيير حالة المتجر</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => {
            if (!tenant) return
            mutate({ tenantId: tenant.tenantId, data })
          })}
          className="space-y-4"
        >
          <UiField>
            <FieldLabel>الحالة</FieldLabel>
            <Select
              value={form.watch("status")}
              onValueChange={(value) =>
                form.setValue("status", value as StoreStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STORE_STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </UiField>

          {(status === "MAINTENANCE" || status === "PAUSED") && (
            <UiField data-invalid={Boolean(form.formState.errors.maintenanceMessage)}>
              <FieldLabel>رسالة الصيانة</FieldLabel>
              <Textarea {...form.register("maintenanceMessage")} rows={3} />
              <FieldError errors={[form.formState.errors.maintenanceMessage]} />
            </UiField>
          )}

          {status === "PASSWORD_PROTECTED" && (
            <UiField data-invalid={Boolean(form.formState.errors.storePassword)}>
              <FieldLabel>كلمة مرور المتجر</FieldLabel>
              <Input type="password" {...form.register("storePassword")} />
              <FieldError errors={[form.formState.errors.storePassword]} />
            </UiField>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" loading={isPending}>
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
