"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { CopyIcon, ShieldCheckIcon, ShieldOffIcon } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import * as React from "react"
import { toast } from "sonner"

import ConfirmAlert from "@/components/system/confirm-alert"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"

import {
  getDisableTotpMutationOptions,
  getEnableTotpMutationOptions,
  getSetupTotpMutationOptions,
} from "../actions"
import type { TotpSetupResponse } from "../types"
import { buildOtpAuthUri } from "../types"

const copy = async (value: string, message: string) => {
  if (typeof navigator === "undefined" || !navigator.clipboard) return
  await navigator.clipboard.writeText(value)
  toast.success(message)
}

type Mode = "idle" | "setup" | "enabled" | "disabled"

export default function TotpSetupCard() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  const [mode, setMode] = React.useState<Mode>("idle")
  const [setupData, setSetupData] = React.useState<TotpSetupResponse | null>(
    null
  )
  const [code, setCode] = React.useState("")
  const [confirmDisable, setConfirmDisable] = React.useState(false)

  const setupMutation = useMutation({
    ...getSetupTotpMutationOptions(),
    onSuccess: (response) => {
      setSetupData(response)
      setCode("")
      setMode("setup")
    },
  })

  const enableMutation = useMutation({
    ...getEnableTotpMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تفعيل المصادقة الثنائية")
        setSetupData(null)
        setCode("")
        setMode("enabled")
      },
    }),
  })

  const disableMutation = useMutation({
    ...getDisableTotpMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تعطيل المصادقة الثنائية")
        setMode("disabled")
      },
    }),
  })

  const otpUri = setupData
    ? buildOtpAuthUri({
        secret: setupData.secret,
        username: user?.username || user?.userId || "user",
      })
    : ""

  const handleEnableSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (code.length !== 6) return
    enableMutation.mutate({ code })
  }

  if (mode === "setup" && setupData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>تفعيل المصادقة الثنائية</CardTitle>
          <CardDescription>
            امسح رمز QR أدناه باستخدام تطبيق المصادقة (مثل Google Authenticator أو Authy)،
            ثم أدخل الرمز المؤقت لتأكيد التفعيل.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-white p-4">
              <QRCodeSVG value={otpUri} size={180} level="M" includeMargin={false} />
            </div>
            <div className="flex w-full flex-col gap-1">
              <Label className="text-xs text-muted-foreground">
                المفتاح اليدوي (في حال تعذّر مسح QR)
              </Label>
              <div className="flex items-center justify-between gap-2 rounded-md border bg-muted px-3 py-2">
                <code className="break-all font-mono text-sm" dir="ltr">
                  {setupData.secret}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => copy(setupData.secret, "تم نسخ المفتاح")}
                  aria-label="نسخ المفتاح"
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-4">
            <h3 className="text-sm font-semibold">رموز الاحتياط</h3>
            <p className="text-xs text-muted-foreground">
              احفظ هذه الرموز في مكان آمن. تُستخدم لاسترداد الوصول في حال فقد جهازك،
              وتُعرض مرة واحدة فقط.
            </p>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {setupData.backupCodes.map((bc) => (
                <li
                  key={bc}
                  className="rounded-md border bg-background px-2 py-1 text-center font-mono text-sm"
                  dir="ltr"
                >
                  {bc}
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() =>
                copy(setupData.backupCodes.join("\n"), "تم نسخ الرموز")
              }
            >
              <CopyIcon className="size-4" />
              نسخ كل الرموز
            </Button>
          </div>

          <form onSubmit={handleEnableSubmit} className="flex flex-col gap-3">
            <Label htmlFor="totp-confirm" className="gap-2">
              <ShieldCheckIcon className="size-4" />
              أدخل الرمز المكوّن من 6 أرقام
            </Label>
            <div className="flex justify-center" dir="ltr">
              <InputOTP
                maxLength={6}
                id="totp-confirm"
                value={code}
                onChange={setCode}
                required
              >
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-12 w-10 text-base" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSetupData(null)
                  setCode("")
                  setMode("idle")
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                loading={enableMutation.isPending}
                disabled={code.length !== 6}
              >
                تأكيد التفعيل
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>المصادقة الثنائية (TOTP)</CardTitle>
          <CardDescription>
            أضف طبقة حماية إضافية إلى حسابك باستخدام رمز يتم توليده من تطبيق المصادقة على هاتفك.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
          {mode === "enabled" && (
            <p className="text-foreground">
              المصادقة الثنائية مفعّلة الآن. سيُطلب منك إدخال الرمز عند تسجيل الدخول.
            </p>
          )}
          {mode === "disabled" && (
            <p className="text-foreground">تم تعطيل المصادقة الثنائية.</p>
          )}
          {mode === "idle" && (
            <p>
              فعّل المصادقة الثنائية لاستلام رمز إضافي عند كل تسجيل دخول. ستحتاج
              إلى تطبيق مصادقة على هاتفك لإكمال الإعداد.
            </p>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          <Button
            onClick={() => setupMutation.mutate()}
            loading={setupMutation.isPending}
            disabled={setupMutation.isPending}
          >
            <ShieldCheckIcon className="size-4" />
            تفعيل المصادقة الثنائية
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmDisable(true)}
            disabled={disableMutation.isPending}
          >
            <ShieldOffIcon className="size-4" />
            تعطيل
          </Button>
        </CardFooter>
      </Card>

      <ConfirmAlert
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        title="تعطيل المصادقة الثنائية"
        description="سيؤدي ذلك إلى تقليل أمان حسابك. هل تريد المتابعة؟"
        actionLabel="تعطيل"
        variant="destructive"
        onAction={() => disableMutation.mutate()}
      />
    </>
  )
}
