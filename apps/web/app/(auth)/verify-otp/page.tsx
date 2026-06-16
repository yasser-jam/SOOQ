"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"
import { toast } from "sonner"

import { ErteqaLogo } from "@/components/erteqa-logo"
import type { ApiError } from "@/lib/api"
import { cleanVerifyOtpPayload } from "@/modules/auth/auth/init"
import { getVerifyOtpMutationOptions } from "@/modules/auth/auth/actions"
import { verifyOtpSchema } from "@/modules/auth/auth/schema"
import Image from "next/image";

function VerifyOtpForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get("phoneNumber")?.trim() ?? ""
  
  const [otp, setOtp] = useState("")
  const [totp, setTotp] = useState("")
  const [mfaRequired, setMfaRequired] = useState(false)
  
  const otpContainerRef = useRef<HTMLDivElement | null>(null)
  const totpContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!phoneNumber) {
      router.replace("/request-otp")
    }
  }, [phoneNumber, router])

  const { isPending, mutate } = useMutation({
    ...getVerifyOtpMutationOptions({
      queryClient,
      onSuccess: () => {
        router.push("/onboarding/create-store")
      },
    }),
    onError: (error: ApiError) => {
      if (error.action === "request-mfa") {
        setMfaRequired(true)
        return
      }
      if (error.action === "show-field-error" && error.fieldKey === "otpCode") {
        setOtp("")
      }
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Todo: remove this after binding
    if (otp === "123456") {
      toast.success("تم التجاوز بنجاح إلى مرحلة إعداد المتجر")
      // استخدام نفس الـ mutation لضمان تحديث session
      mutate(cleanVerifyOtpPayload({
        phone: phoneNumber,
        otpCode: otp,
        totpCode: mfaRequired ? totp : undefined,
      }))
      return
    }

    if (!phoneNumber || otp.length !== 6) return
    if (mfaRequired && totp.length !== 6) return

    const parsed = verifyOtpSchema.parse({
      phone: phoneNumber,
      otpCode: otp,
      totpCode: mfaRequired ? totp : undefined,
    })
    mutate(cleanVerifyOtpPayload(parsed))
  }

  if (!phoneNumber) return null

  return (
    <div className="min-h-screen w-full flex flex-row">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center text-center">
            <ErteqaLogo size="xl" className="mb-6" priority />
            <h1 className="text-2xl font-bold mb-2">تأكيد الرمز</h1>
            <p className="text-muted-foreground text-sm">أدخل الرمز المكوّن من 6 أرقام</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <p className="text-muted-foreground text-center text-sm" dir="ltr">{phoneNumber}</p>
                <Label htmlFor="otp" className="text-sm font-medium flex justify-center items-center gap-2">
                  <ShieldCheckIcon className="size-4" /> رمز التحقق
                </Label>
                <div ref={otpContainerRef} className="mt-2 flex justify-center py-1" dir="ltr">
                  <InputOTP maxLength={6} id="otp" value={otp} onChange={setOtp} required>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base bg-[#FCFDFD]" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isPending}
              disabled={otp.length !== 6}
              className="w-full bg-[#B47D1C] hover:bg-[#966717] text-white"
            >
              تأكيد
              <ArrowLeftIcon className="mr-2" />
            </Button>
          </form>
        </div>
      </div>

      <div className="hidden lg:block w-1/2 relative min-h-[500px] overflow-hidden">
        <Image
          src="/images/Group 1000006180.png"
          alt="Form Illustration"
          width={500}
          height={500}
          className="absolute inset-0 w-full h-full object-contain p-10 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">جاري التحميل…</div>}>
      <VerifyOtpForm />
    </Suspense>
  )
}