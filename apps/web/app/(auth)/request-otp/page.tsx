"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { ArrowLeftIcon, PhoneIcon, UserIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import Field from "@/components/system/Field"
import type { ApiError } from "@/lib/api"
import { cleanRequestOtpPayload, requestOtpDefaultValues } from "@/modules/auth/auth/init"
import {
  getRequestOtpMutationOptions,
} from "@/modules/auth/auth/actions"
import GoogleSignInButton from "@/modules/auth/auth/components/GoogleSignInButton"
import { useOtpCooldown } from "@/modules/auth/auth/hooks/useOtpCooldown"
import { requestOtpSchema } from "@/modules/auth/auth/schema"

const merchantRoles = [
  { value: "OWNER", label: "مالك متجر" },
  { value: "MANAGER", label: "مدير" },
  { value: "STAFF", label: "موظف" },
  { value: "PLATFORM_ADMIN", label: "مشرف منصة" },
] as const

type RequestOtpForm = z.input<typeof requestOtpSchema>

export default function RequestOtpPage() {
  const router = useRouter()
  const cooldown = useOtpCooldown(60)

  const form = useForm<RequestOtpForm>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: requestOtpDefaultValues,
  })

  const { isPending, mutate } = useMutation({
    ...getRequestOtpMutationOptions(),
    onSuccess: (_, variables) => {
      cooldown.start(60)
      const phone = encodeURIComponent(variables.phone)
      router.push(`/verify-otp?phoneNumber=${phone}`)
      toast.success("تم إرسال رمز التحقق بنجاح")
    },
    onError: (error: ApiError) => {
      if (error.action === "show-cooldown") {
        cooldown.start(error.retryAfterSeconds ?? 60)
        toast.error(error.message)
      }
    },
  })

  const handleSubmit = (data: RequestOtpForm) => {
    mutate(cleanRequestOtpPayload(requestOtpSchema.parse(data)))
  }

  const submitDisabled = isPending || cooldown.isCooling
  const selectedRole = form.watch("role")

  return (
    <Card className="w-full max-w-1/3">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <CardHeader className="mb-4 text-center">
          <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
            <AvatarImage src="/logo.png" alt="logo" />
            <AvatarFallback className="font-bold text-primary-foreground">
              SOOQ
            </AvatarFallback>
          </Avatar>

          <CardTitle>طلب رمز التحقق</CardTitle>
          <CardDescription>
            أدخل رقم هاتفك لنرسل إليك رمز التحقق عبر الواتساب
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-5">
            <Field<RequestOtpForm>
              name="phone"
              control={form.control}
              placeholder="+963 9XX XXX XXX"
              label={
                <>
                  <PhoneIcon className="size-4" />
                  رقم الهاتف
                </>
              }
              inputProps={{ type: "tel", dir: "ltr" }}
            />

            <Field<RequestOtpForm>
              name="fullName"
              control={form.control}
              placeholder="مطلوب فقط لأول تسجيل"
              label={
                <>
                  <UserIcon className="size-4" />
                  الاسم الكامل (اختياري)
                </>
              }
            />

            <UiField data-invalid={Boolean(form.formState.errors.role)}>
              <FieldLabel htmlFor="role">نوع الحساب</FieldLabel>
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="role" className="w-full">
                      <SelectValue placeholder="اختر نوع الحساب" />
                    </SelectTrigger>
                    <SelectContent>
                      {merchantRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[form.formState.errors.role]} />
            </UiField>
          </div>
        </CardContent>

        <CardFooter className="mt-10 flex-col gap-3 px-4">
          <Button
            type="submit"
            size="lg"
            loading={isPending}
            disabled={submitDisabled}
            className="w-full"
          >
            {cooldown.isCooling
              ? `حاول بعد ${cooldown.remaining} ثانية`
              : "إرسال الرمز"}
            <ArrowLeftIcon />
          </Button>

          <div className="flex w-full items-center gap-3 py-1 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            أو
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton role={selectedRole ?? "OWNER"} />
        </CardFooter>
      </form>
    </Card>
  )
}
