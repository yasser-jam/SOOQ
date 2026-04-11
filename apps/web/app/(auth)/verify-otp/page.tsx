"use client"

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

export default function VerifyOtpPage() {
  return (
    <Card className="w-full max-w-1/3">
      <form>
        <CardHeader className="mb-4 text-center">
          <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
            <AvatarImage src="/logo.png" alt="logo" />
            <AvatarFallback className="font-bold text-primary-foreground">
              SOOQ
            </AvatarFallback>
          </Avatar>

          <CardTitle>تأكيد الرمز</CardTitle>
          <CardDescription>
            أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى بريدك
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="otp" className="justify-center gap-2">
                <ShieldCheckIcon className="size-4" />
                رمز التحقق
              </Label>

              <div className="flex justify-center py-1" dir="ltr">
                <InputOTP maxLength={6} id="otp" name="otp" required>
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
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button type="submit" size="lg" className="w-full">
            تأكيد
            <ArrowLeftIcon />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
