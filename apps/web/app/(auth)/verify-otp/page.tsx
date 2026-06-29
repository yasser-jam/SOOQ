"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, PhoneIcon, ShieldCheckIcon } from "lucide-react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { ErteqaLogo } from "@/components/erteqa-logo"
import type { ApiError } from "@/lib/api"
import { getVerifyOtpMutationOptions } from "@/modules/auth/auth/actions"
import { cleanVerifyOtpPayload } from "@/modules/auth/auth/init"
import { verifyOtpSchema } from "@/modules/auth/auth/schema"
import type { VerifyOtpInput } from "@/modules/auth/auth/types"

function VerifyOtpForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get("phoneNumber")?.trim() ?? ""

  const [mfaRequired, setMfaRequired] = useState(false)
  const otpContainerRef = useRef<HTMLDivElement | null>(null)

  const form = useForm<Omit<VerifyOtpInput, "phone">>({
    resolver: zodResolver(verifyOtpSchema.omit({ phone: true })),
    defaultValues: {
      otpCode: "",
      totpCode: "",
      backupCode: "",
    },
  })

  useEffect(() => {
    if (!phoneNumber) {
      router.replace("/request-otp")
      return
    }

    const firstOtpInput = otpContainerRef.current?.querySelector("input")
    firstOtpInput?.focus()
  }, [phoneNumber, router])

  const { isPending, mutate } = useMutation({
    ...getVerifyOtpMutationOptions({
      queryClient,
      onSuccess: () => {
        router.push("/")
      },
    }),
    onError: (error: ApiError) => {
      if (error.action === "request-mfa") {
        setMfaRequired(true)
      }
    },
  })

  const handleSubmit = (data: Omit<VerifyOtpInput, "phone">) => {
    const totpCode = data.totpCode?.trim()
    if (mfaRequired && totpCode?.length !== 6) return

    mutate(
      cleanVerifyOtpPayload({
        ...data,
        phone: phoneNumber,
      })
    )
  }

  const otpCode = useWatch({ control: form.control, name: "otpCode" })

  if (!phoneNumber) return null

  return (
    <div className="flex min-h-screen w-full flex-row">
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex flex-col items-center text-center">
            <ErteqaLogo size="xl" className="mb-4" priority />

            <h1 className="mb-2 text-2xl font-bold">تأكيد الرمز</h1>

            <p className="text-sm text-muted-foreground">
              أدخل الرمز المكوّن من 6 أرقام
            </p>
          </div>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <p className="mt-6 flex items-center justify-center gap-2 text-primary" dir="ltr">
              <PhoneIcon className="size-4" />
              {phoneNumber}
            </p>

            <Label
              htmlFor="otp"
              className="flex items-center justify-center gap-2 text-sm font-medium"
            >
              <ShieldCheckIcon className="size-4" /> رمز التحقق
            </Label>

            <div
              ref={otpContainerRef}
              className="flex justify-center py-1"
              dir="ltr"
            >
              <Controller
                name="otpCode"
                control={form.control}
                render={({ field }) => (
                  <InputOTP
                    maxLength={6}
                    id="otp"
                    value={field.value}
                    onChange={field.onChange}
                    required
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot
                          key={i}
                          index={i}
                          className="h-12 w-10 bg-[#FCFDFD] text-base"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isPending}
              disabled={otpCode?.length !== 6}
              className="w-full bg-[#B47D1C] text-white hover:bg-[#966717]"
            >
              تأكيد
              <ArrowLeftIcon className="mr-2" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push("/request-otp")}
            >
              تغيير الرقم
            </Button>
          </form>
        </div>
      </div>

      <div className="relative hidden min-h-[500px] w-1/2 overflow-hidden lg:block">
        <Image
          src="/images/Group 1000006180.png"
          alt="Form Illustration"
          width={500}
          height={500}
          className="absolute inset-0 h-full w-full animate-in object-contain p-10 duration-1000 ease-out fade-in slide-in-from-right-12"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          جاري التحميل…
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  )
}
