"use client"

import { api } from "@/lib/api"
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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, PhoneIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RequestOtpPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")

  const { isPending, mutate } = useMutation({
    mutationFn: () =>
      api("/auth/otp/request", {
        method: "POST",
        body: {
          phone,
          role: "OWNER",
        },
      }),

    onSuccess: () => {
      const q = encodeURIComponent(phone.trim())
      router.push(`/verify-otp?phoneNumber=${q}`)
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    mutate()
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

          <CardTitle>طلب رمز التحقق</CardTitle>
          <CardDescription>
            أدخل رقم هاتفك لنرسل إليك رمز التحقق عبر الرسائل النصية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="phone" className="gap-2">
                <PhoneIcon className="size-4" />
                رقم الهاتف
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+963 9XX XXX XXX"
                required
                dir="ltr"
                className="text-left"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-12 flex-col gap-2 px-4">
          <Button
            type="submit"
            size="lg"
            loading={isPending}
            className="w-full"
          >
            إرسال الرمز
            <ArrowLeftIcon />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
