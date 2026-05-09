"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import Field from "@/components/system/Field"

import { getUpdateStoreRateLimitMutationOptions } from "../actions"
import { updateStoreRateLimitDefaultValues } from "../init"
import { updateStoreRateLimitSchema } from "../schema"
import type { UpdateStoreRateLimitInput } from "../types"

type FormInput = z.input<typeof updateStoreRateLimitSchema>

export default function StoreRateLimitForm({
  tenantId,
  initialRequestsPerMinute,
}: {
  tenantId: string
  initialRequestsPerMinute?: number
}) {
  const queryClient = useQueryClient()

  const form = useForm<FormInput>({
    resolver: zodResolver(updateStoreRateLimitSchema),
    defaultValues: {
      requestsPerMinute:
        initialRequestsPerMinute ??
        updateStoreRateLimitDefaultValues.requestsPerMinute,
    },
  })

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreRateLimitMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث حد المعدّل")
      },
    }),
  })

  const handleSubmit = (data: FormInput) => {
    const parsed = updateStoreRateLimitSchema.parse(data) as UpdateStoreRateLimitInput
    mutate({ tenantId, data: parsed })
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader>
          <CardTitle>حدّ المعدّل</CardTitle>
          <CardDescription>
            عدد الطلبات المسموح بها في الدقيقة لكل عميل (بين 1 و 10000).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Field<FormInput>
            name="requestsPerMinute"
            control={form.control}
            label="طلبات/دقيقة"
            inputProps={{ type: "number", min: 1, max: 10000 }}
          />
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" loading={isPending}>
            حفظ
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
