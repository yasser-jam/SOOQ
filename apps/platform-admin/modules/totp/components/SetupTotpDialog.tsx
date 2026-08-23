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

import ConfirmAlert from "@/components/system/ConfirmAlert"
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser"

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

export function SetupTotpDialog() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  const [setupData, setSetupData] = React.useState<TotpSetupResponse | null>(null)
  const [code, setCode] = React.useState("")
  const [confirmDisable, setConfirmDisable] = React.useState(false)

  const setupMutation = useMutation({
    ...getSetupTotpMutationOptions(),
    onSuccess: (response) => {
      setSetupData(response)
      setCode("")
    },
  })

  const enableMutation = useMutation({
    ...getEnableTotpMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تفعيل المصادقة الثنائية")
        setSetupData(null)
        setCode("")
      },
    }),
  })

  const disableMutation = useMutation({
    ...getDisableTotpMutationOptions({
      queryClient,
      onSuccess: () => toast.success("تم تعطيل المصادقة الثنائية"),
    }),
  })

  const otpUri =
    setupData && user
      ? buildOtpAuthUri({ secret: setupData.secret, username: user.username })
      : null

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheckIcon className="size-5" />
            المصادقة الثنائية (TOTP)
          </CardTitle>
          <CardDescription>
            أضف طبقة أمان إضافية لحساب مدير المنصة.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!setupData ? (
            <Button
              onClick={() => setupMutation.mutate()}
              loading={setupMutation.isPending}
            >
              بدء الإعداد
            </Button>
          ) : (
            <>
              {otpUri ? (
                <div className="flex justify-center rounded-lg border p-4">
                  <QRCodeSVG value={otpUri} size={180} />
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-sm">
                <code dir="ltr" className="rounded bg-muted px-2 py-1">
                  {setupData.secret}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void copy(setupData.secret, "تم نسخ المفتاح")}
                >
                  <CopyIcon className="size-4" />
                </Button>
              </div>
              {setupData.backupCodes.length > 0 ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                  <p className="mb-2 font-medium">رموز النسخ الاحتياطي:</p>
                  <ul className="grid grid-cols-2 gap-1 font-mono" dir="ltr">
                    {setupData.backupCodes.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="totp-confirm">رمز التأكيد</Label>
                <div className="flex justify-center" dir="ltr">
                  <InputOTP maxLength={6} value={code} onChange={setCode}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="gap-2">
          {setupData ? (
            <>
              <Button
                onClick={() => enableMutation.mutate({ code })}
                loading={enableMutation.isPending}
                disabled={code.length !== 6}
              >
                تفعيل
              </Button>
              <Button variant="ghost" onClick={() => setSetupData(null)}>
                إلغاء
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmDisable(true)}
              loading={disableMutation.isPending}
            >
              <ShieldOffIcon className="size-4" />
              تعطيل TOTP
            </Button>
          )}
        </CardFooter>
      </Card>

      <ConfirmAlert
        open={confirmDisable}
        onOpenChange={setConfirmDisable}
        title="تعطيل المصادقة الثنائية"
        description="سيتم إزالة TOTP من حسابك. هل أنت متأكد؟"
        actionLabel="تعطيل"
        variant="destructive"
        onAction={() => disableMutation.mutate()}
      />
    </>
  )
}
