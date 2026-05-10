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
import { ArrowLeftIcon, PhoneIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import PhoneField from "@/components/system/PhoneField"
import type { ApiError } from "@/lib/api"
import { phoneSchema } from "@/lib/schema"
import { getRequestOtpMutationOptions } from "@/modules/auth/auth/actions"
import GoogleSignInButton from "@/modules/auth/auth/components/GoogleSignInButton"
import { useOtpCooldown } from "@/modules/auth/auth/hooks/useOtpCooldown"

const loginFormSchema = z.object({
  phone: phoneSchema,
})

type LoginForm = z.infer<typeof loginFormSchema>

export default function RequestOtpPage() {
  const router = useRouter()
  const cooldown = useOtpCooldown(60)

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { phone: "" },
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

  const handleSubmit = (data: LoginForm) => {
    // Login is OWNER-by-default — backend resolves the actual role from the
    // existing user record. Signup uses /onboarding/create-store, which sends
    // its own role + fullName.
    mutate({
      phone: data.phone.trim(),
      role: "OWNER",
      fullName: undefined,
      tenantSlug: undefined,
      tenantId: undefined,
    })
  }

  const submitDisabled = isPending || cooldown.isCooling

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

          <CardTitle>تسجيل الدخول</CardTitle>
          <CardDescription>
            أدخل رقم هاتفك لنرسل إليك رمز التحقق عبر الواتساب
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PhoneField<LoginForm>
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
        </CardContent>

        <CardFooter className="mt-8 flex-col gap-3 px-4">
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

          <GoogleSignInButton role="OWNER" />

          <p className="mt-2 text-center text-sm text-muted-foreground">
            ليس لديك متجر بعد؟{" "}
            <Link
              href="/onboarding/create-store"
              className="font-medium text-primary hover:underline"
            >
              أنشئ متجرك الآن
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
