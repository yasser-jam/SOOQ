"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
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

import type { ApiError } from "@/lib/api"
import { cleanVerifyOtpPayload } from "@/modules/auth/auth/init"
import { getVerifyOtpMutationOptions } from "@/modules/auth/auth/actions"
import { verifyOtpSchema } from "@/modules/auth/auth/schema"

function VerifyOtpForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get("phoneNumber")?.trim() ?? ""
  const redirectTo = searchParams.get("redirect") || null

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

  useEffect(() => {
    const firstOtpInput = otpContainerRef.current?.querySelector("input")
    firstOtpInput?.focus()
  }, [])

  useEffect(() => {
    if (!mfaRequired) return
    const firstTotpInput = totpContainerRef.current?.querySelector("input")
    firstTotpInput?.focus()
  }, [mfaRequired])

  const { isPending, mutate } = useMutation({
    ...getVerifyOtpMutationOptions({
      queryClient,
      onSuccess: (_response, isHub) => {
        if (isHub) {
          toast.info("أكمل إعداد متجرك")
          router.push("/onboarding/create-store")
          return
        }
        router.push(redirectTo ?? "/")
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
    if (!phoneNumber || otp.length !== 6) return
    if (mfaRequired && totp.length !== 6) return

    const parsed = verifyOtpSchema.parse({
      phone: phoneNumber,
      otpCode: otp,
      totpCode: mfaRequired ? totp : undefined,
    })
    mutate(cleanVerifyOtpPayload(parsed))
  }

  if (!phoneNumber) {
    return null
  }

  return (
    <Card className="w-full max-w-1/3">
      <form onSubmit={handleSubmit}>
        <CardHeader className="mb-4 text-center">
          <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
            <AvatarImage src="/logo.png" alt="logo" />
            <AvatarFallback className="font-bold text-primary-foreground">
              SOOQ
            </AvatarFallback>
          </Avatar>

          <CardTitle>تأكيد الرمز</CardTitle>
          <CardDescription>
            أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى هاتفك
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <p className="text-muted-foreground text-center text-sm" dir="ltr">
                {phoneNumber}
              </p>
              <Label htmlFor="otp" className="justify-center gap-2">
                <ShieldCheckIcon className="size-4" />
                رمز التحقق
              </Label>

              <div ref={otpContainerRef} className="mt-2 flex justify-center py-1" dir="ltr">
                <InputOTP
                  maxLength={6}
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={setOtp}
                  required
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={1} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={2} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={3} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={4} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={5} className="h-12 w-10 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {mfaRequired && (
              <div className="grid gap-2">
                <Label htmlFor="totp" className="justify-center gap-2">
                  <ShieldCheckIcon className="size-4" />
                  رمز المصادقة الثنائية
                </Label>
                <p className="text-muted-foreground text-center text-xs">
                  افتح تطبيق المصادقة وأدخل الرمز المؤقت
                </p>
                <div ref={totpContainerRef} className="mt-2 flex justify-center py-1" dir="ltr">
                  <InputOTP
                    maxLength={6}
                    id="totp"
                    name="totp"
                    value={totp}
                    onChange={setTotp}
                    required
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-10 text-base" />
                      <InputOTPSlot index={1} className="h-12 w-10 text-base" />
                      <InputOTPSlot index={2} className="h-12 w-10 text-base" />
                      <InputOTPSlot index={3} className="h-12 w-10 text-base" />
                      <InputOTPSlot index={4} className="h-12 w-10 text-base" />
                      <InputOTPSlot index={5} className="h-12 w-10 text-base" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="mt-12 flex-col gap-2 px-4">
          <Button
            type="submit"
            size="lg"
            loading={isPending}
            disabled={
              otp.length !== 6 || (mfaRequired && totp.length !== 6)
            }
            className="w-full"
          >
            تأكيد
            <ArrowLeftIcon />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-1/3 p-8 text-center text-muted-foreground">
          جاري التحميل…
        </Card>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  )
}
