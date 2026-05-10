"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, ShieldCheckIcon, StoreIcon } from "lucide-react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"
import type { FormEvent } from "react"

import type { ApiError } from "@/lib/api"
import { getVerifyCustomerOtpMutationOptions } from "@/modules/auth/customer-auth/actions"
import { cleanVerifyCustomerOtpPayload } from "@/modules/auth/customer-auth/init"
import { verifyCustomerOtpSchema } from "@/modules/auth/customer-auth/schema"

function CustomerVerifyOtpForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const params = useParams<{ storeSlug: string }>()
  const storeSlug = params?.storeSlug ?? ""
  const searchParams = useSearchParams()
  const phoneNumber = searchParams.get("phoneNumber")?.trim() ?? ""

  const [otp, setOtp] = useState("")
  const otpContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!phoneNumber) {
      router.replace(`/shop/${storeSlug}/request-otp`)
    }
  }, [phoneNumber, router, storeSlug])

  useEffect(() => {
    const firstOtpInput = otpContainerRef.current?.querySelector("input")
    firstOtpInput?.focus()
  }, [])

  const { isPending, mutate } = useMutation({
    ...getVerifyCustomerOtpMutationOptions({
      queryClient,
      onSuccess: () => {
        router.push(`/shop/${storeSlug}`)
      },
    }),
    onError: (error: ApiError) => {
      if (error.action === "show-field-error" && error.fieldKey === "otpCode") {
        setOtp("")
      }
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!phoneNumber || otp.length !== 6) return

    const parsed = verifyCustomerOtpSchema.parse({
      phone: phoneNumber,
      tenantSlug: storeSlug,
      otpCode: otp,
    })
    mutate(cleanVerifyCustomerOtpPayload(parsed))
  }

  if (!phoneNumber) {
    return null
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <Avatar className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <AvatarFallback className="bg-transparent text-primary">
                <StoreIcon className="size-6" />
              </AvatarFallback>
            </Avatar>
            <CardTitle>تأكيد الرمز</CardTitle>
            <CardDescription>
              متجر <span className="font-mono" dir="ltr">{storeSlug}</span>
              <br />
              أرسلنا رمزاً إلى&nbsp;
              <span className="font-mono" dir="ltr">{phoneNumber}</span>
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <Label htmlFor="customer-otp" className="justify-center gap-2">
              <ShieldCheckIcon className="size-4" />
              رمز التحقق
            </Label>
            <div ref={otpContainerRef} className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                id="customer-otp"
                value={otp}
                onChange={setOtp}
                required
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot
                      key={i}
                      index={i}
                      className="h-12 w-10 text-base"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </CardContent>

          <CardFooter className="flex-col gap-2">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={isPending}
              disabled={otp.length !== 6}
            >
              تأكيد
              <ArrowLeftIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/shop/${storeSlug}/request-otp`)}
            >
              تغيير الرقم
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default function CustomerVerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
          <Card className="w-full max-w-md p-8 text-center text-muted-foreground">
            جاري التحميل…
          </Card>
        </div>
      }
    >
      <CustomerVerifyOtpForm />
    </Suspense>
  )
}
