"use client"

import api from "@/lib/api"
import { addCookie } from "@/lib/cookies"
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
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, ShieldCheckIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import type { FormEvent } from "react"
import { Suspense, useEffect, useRef, useState } from "react"

function VerifyOtpForm() {
  type VerifyOtpResponse = {
    data?: {
      accessToken?: string
    }
  }

  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get("phoneNumber")?.trim() ?? ""

  const [otp, setOtp] = useState("")
  const otpContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!phoneNumber) {
      router.replace("/request-otp")
    }
  }, [phoneNumber, router])

  useEffect(() => {
    const firstOtpInput = otpContainerRef.current?.querySelector("input")
    firstOtpInput?.focus()
  }, [])

  const { isPending, mutate } = useMutation({
    mutationFn: () =>
      api<VerifyOtpResponse>("/auth/otp/verify", {
        method: "POST",
        body: {
          phone: phoneNumber,
          otpCode: otp,
          tenantSlug: "my-store",
        }
      }),
    onSuccess: (response: VerifyOtpResponse) => {
      const accessToken = response?.data?.accessToken
      if (accessToken) {
        addCookie('sooq-access-token', accessToken)
      }
      router.push("/onboarding/create-store")
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!phoneNumber || otp.length !== 6) return
    mutate()
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
                  <InputOTPGroup >
                    <InputOTPSlot index={0} className="h-12 w-10 text-base"  />
                    <InputOTPSlot index={1} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={2} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={3} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={4} className="h-12 w-10 text-base" />
                    <InputOTPSlot index={5} className="h-12 w-10 text-base" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-12 flex-col gap-2 px-4">
          <Button
            type="submit"
            size="lg"
            loading={isPending}
            disabled={otp.length !== 6}
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
