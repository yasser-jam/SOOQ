"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import Link from "next/link"

import { ErteqaLogo } from "@/components/erteqa-logo"
import PhoneField from "@/components/system/PhoneField"
import type { ApiError } from "@/lib/api"
import { phoneSchema } from "@/lib/schema"
import { getRequestOtpMutationOptions } from "@/modules/auth/auth/actions"
import { useOtpCooldown } from "@/modules/auth/auth/hooks/useOtpCooldown"
import GoogleSignInButton from "@/modules/auth/auth/components/GoogleSignInButton"

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
    mutate({ phone: data.phone.trim() })
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* 1. الجزء الأيسر: النموذج */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center text-center">
            <ErteqaLogo size="xl" className="mb-6" priority />
            <h1 className="text-2xl font-bold mb-2">تسجيل الدخول</h1>
            <p className="text-muted-foreground text-sm">
              ادخل رقم هاتفك لنرسل إليك رمز التحقق عبر الواتساب
            </p>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <PhoneField<LoginForm>
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
              className="w-full bg-[#B47D1C] hover:bg-[#966717] text-white"
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

          <GoogleSignInButton role="OWNER" />
          </form>
        </div>
      </div>

      {/* 2. الجزء الأيمن: الصورة */}
      <div className="hidden lg:block w-1/2 relative min-h-[500px] overflow-hidden">
        <img
          src="/images/Group 1000006180.png"
          alt="Form Illustration"
          className="absolute inset-0 w-full h-full object-contain p-10 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out"
        />
      </div>
    </div>
  )
}