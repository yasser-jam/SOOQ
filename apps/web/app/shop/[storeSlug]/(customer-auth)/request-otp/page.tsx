"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import {
  Avatar,
  AvatarFallback,
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
import { ArrowLeftIcon, PhoneIcon, StoreIcon, UserIcon } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import Field from "@/components/system/Field"
import PhoneField from "@/components/system/PhoneField"
import type { ApiError } from "@/lib/api"
import { useOtpCooldown } from "@/modules/auth/auth/hooks/useOtpCooldown"
import {
  getRequestCustomerOtpMutationOptions,
} from "@/modules/auth/customer-auth/actions"
import {
  cleanRequestCustomerOtpPayload,
  requestCustomerOtpDefaultValues,
} from "@/modules/auth/customer-auth/init"
import { requestCustomerOtpSchema } from "@/modules/auth/customer-auth/schema"

type RequestForm = z.infer<typeof requestCustomerOtpSchema>

export default function CustomerRequestOtpPage() {
  const router = useRouter()
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params?.storeSlug ?? ""
  const cooldown = useOtpCooldown(60)

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestCustomerOtpSchema),
    defaultValues: {
      ...requestCustomerOtpDefaultValues,
      tenantSlug: storeSlug,
    },
  })

  const { isPending, mutate } = useMutation({
    ...getRequestCustomerOtpMutationOptions(),
    onSuccess: (_data, variables) => {
      cooldown.start(60)
      const phone = encodeURIComponent(variables.phone)
      router.push(`/shop/${storeSlug}/verify-otp?phoneNumber=${phone}`)
      toast.success("تم إرسال رمز التحقق")
    },
    onError: (error: ApiError) => {
      if (error.action === "show-cooldown") {
        cooldown.start(error.retryAfterSeconds ?? 60)
        toast.error(error.message)
      }
    },
  })

  const handleSubmit = (data: RequestForm) => {
    mutate(
      cleanRequestCustomerOtpPayload(
        requestCustomerOtpSchema.parse({ ...data, tenantSlug: storeSlug })
      )
    )
  }

  const submitDisabled = isPending || cooldown.isCooling

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardHeader className="text-center">
            <Avatar className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <AvatarFallback className="bg-transparent text-primary">
                <StoreIcon className="size-6" />
              </AvatarFallback>
            </Avatar>
            <CardTitle>تسجيل الدخول</CardTitle>
            <CardDescription>
              متجر <span className="font-mono" dir="ltr">{storeSlug}</span>
              <br />
              أدخل رقم هاتفك لاستلام رمز تحقق.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <PhoneField<RequestForm>
              name="phone"
              control={form.control}
              placeholder="9XX XXX XXX"
              label={
                <>
                  <PhoneIcon className="size-4" />
                  رقم الهاتف
                </>
              }
              disabled={isPending}
            />

            <Field<RequestForm>
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
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isPending}
              disabled={submitDisabled}
            >
              {cooldown.isCooling
                ? `حاول بعد ${cooldown.remaining} ثانية`
                : "إرسال الرمز"}
              <ArrowLeftIcon />
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
