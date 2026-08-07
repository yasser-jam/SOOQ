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
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import type * as z from "zod"

import PhoneField from "@/components/system/PhoneField"
import type { ApiError } from "@/lib/api"
import { getCreateStaffMutationOptions } from "../actions"
import { createStaffSchema } from "../schema"
import type { StaffCreateRequestDto } from "../types"

type FormInput = z.input<typeof createStaffSchema>

export default function StaffForm() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<FormInput>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  })

  const { isPending, mutate } = useMutation({
    ...getCreateStaffMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم إنشاء الموظف. يمكنه الدخول الآن عبر OTP.")
        router.push(`/staff`)
      },
    }),
    onError: (error: ApiError) => {
      const status = (error as { status?: number })?.status
      const message = error?.message ?? "تعذّر إنشاء الموظف"
      if (status === 409) {
        form.setError("phone", {
          type: "server",
          message: "موظف آخر يستخدم هذا الرقم.",
        })
        return
      }
      toast.error(message)
    },
  })

  const handleSubmit = (raw: FormInput) => {
    const data = createStaffSchema.parse(raw) as StaffCreateRequestDto
    mutate(data)
  }

  return (
    <Card>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader>
          <CardTitle>إضافة موظف جديد</CardTitle>
          <CardDescription>
            بعد الإنشاء، يدخل الموظف عبر OTP باستخدام رقم هاتفه.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <UiField data-invalid={Boolean(form.formState.errors.fullName)}>
              <FieldLabel htmlFor="fullName">الاسم الكامل</FieldLabel>
              <Controller
                name="fullName"
                control={form.control}
                render={({ field }) => (
                  <Input {...field} id="fullName" placeholder="مثال: فاطمة" />
                )}
              />
              <FieldError errors={[form.formState.errors.fullName]} />
            </UiField>

            <PhoneField
              name="phone"
              control={form.control}
              label="رقم الهاتف"
            />
          </div>
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/staff`)}
            disabled={isPending}
          >
            إلغاء
          </Button>
          <Button type="submit" loading={isPending}>
            إنشاء
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
