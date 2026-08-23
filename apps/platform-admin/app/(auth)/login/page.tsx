"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import PhoneField from "@/components/system/PhoneField"
import { siteConfig } from "@/config/site-config"
import type { ApiError } from "@/lib/api"
import { phoneSchema } from "@/lib/schema"
import { getRequestOtpMutationOptions } from "@/modules/auth/actions"
import { GoogleSignInButton } from "@/modules/auth/components/GoogleSignInButton"
import { useOtpCooldown } from "@/modules/auth/hooks/useOtpCooldown"

const loginFormSchema = z.object({
  phone: phoneSchema,
})

type LoginForm = z.infer<typeof loginFormSchema>

export default function LoginPage() {
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

  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/images/logo-platform.svg"
              alt={siteConfig.name}
              width={160}
              height={48}
              className="mb-6"
              priority
            />
            <h1 className="mb-2 text-2xl font-bold">تسجيل الدخول</h1>
            <p className="text-sm text-muted-foreground">
              ادخل رقم هاتفك لنرسل إليك رمز التحقق عبر الواتساب
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit((data) => mutate({ phone: data.phone.trim() }))}
            className="space-y-6"
          >
            <PhoneField
              name="phone"
              control={form.control}
              placeholder="+963"
              label="رقم الهاتف"
              disabled={isPending}
            />
            <Button
              type="submit"
              size="lg"
              loading={isPending}
              disabled={isPending || cooldown.isCooling}
              className="w-full bg-[#B47D1C] text-white hover:bg-[#966717]"
            >
              {cooldown.isCooling
                ? `حاول بعد ${cooldown.remaining} ثانية`
                : "إرسال الرمز"}
            </Button>
            <div className="flex w-full items-center gap-3 py-1 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              أو
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleSignInButton role="PLATFORM_ADMIN" />
          </form>
        </div>
      </div>
      <div className="relative hidden min-h-[500px] w-1/2 overflow-hidden bg-muted/30 lg:block" />
    </div>
  )
}
