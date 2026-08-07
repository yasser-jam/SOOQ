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
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { getUpdateRateLimitMutationOptions } from "../actions"
import { updateStoreRateLimitSchema } from "../schema"
import type { TenantSummary, UpdateStoreRateLimitInput } from "../types"

type UpdateRateLimitDialogProps = {
  tenant: TenantSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateRateLimitDialog({
  tenant,
  open,
  onOpenChange,
}: UpdateRateLimitDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<UpdateStoreRateLimitInput>({
    resolver: zodResolver(updateStoreRateLimitSchema),
    defaultValues: {
      requestsPerMinute: tenant?.requestsPerMinute ?? 60,
    },
  })

  const { mutate, isPending } = useMutation({
    ...getUpdateRateLimitMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث حد الطلبات")
        onOpenChange(false)
      },
    }),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>حد الطلبات في الدقيقة</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => {
            if (!tenant) return
            mutate({ tenantId: tenant.tenantId, data })
          })}
          className="space-y-4"
        >
          <UiField data-invalid={Boolean(form.formState.errors.requestsPerMinute)}>
            <FieldLabel>طلبات/دقيقة</FieldLabel>
            <Input
              type="number"
              min={1}
              max={10000}
              {...form.register("requestsPerMinute", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.requestsPerMinute]} />
          </UiField>
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
