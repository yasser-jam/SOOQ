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
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { ArrowLeftIcon, LockIcon, MailIcon } from "lucide-react"
import { redirect } from "next/navigation"

export default function LoginPage() {
  return (
    <Card className="w-full max-w-1/3">
      <CardHeader className="mb-4 text-center">
        <Avatar className="mx-auto mb-2 rounded-lg bg-primary p-8 text-5xl">
          <AvatarImage src="/logo.png" alt="logo" />
          <AvatarFallback className="font-bold text-primary-foreground">
            SOOQ
          </AvatarFallback>
        </Avatar>

        <CardTitle>قم بتسجيل الدخول</CardTitle>
        <CardDescription>انضم إلينا وابدأ بالتسويق الإلكتروني</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">
                <MailIcon />
                البريد الإلكتروني
              </Label>

              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">
                  <LockIcon />
                  كلمة المرور
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="********"
                required
              />
            </div>
          </div>

          <a
            href="#"
            className="inline-block text-sm underline-offset-4 hover:underline"
          >
            هل نسيت كلمة المرور؟
          </a>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" size="lg">
          سجل الدخول
          <ArrowLeftIcon />
        </Button>

        <div className="flex items-center text-sm">
          ليس لديك حساب؟
          {/* <Button variant="link" onClick={() => redirect("/signup")}>
            أنشئ حسابك الآن
          </Button>
          أو */}
          <Button variant="link" onClick={() => redirect("/request-otp")}>
            سجل باستخدام رقم الهاتف
          </Button>
        </div>
        {/* <Button variant="outline" className="w-full">
            تسجيل الدخول عن طريق Google
          </Button> */}
      </CardFooter>
    </Card>
  )
}
