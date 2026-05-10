"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@workspace/ui/components/input-otp"
import { Input } from "@workspace/ui/components/input"
import { ArrowLeftIcon, CheckCircle2, PhoneIcon } from "lucide-react"
import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import PhoneField from "@/components/system/PhoneField"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"

import {
  getRequestPhoneChangeMutationOptions,
  getVerifyPhoneChangeMutationOptions,
} from "../actions"
import {
  requestPhoneChangeDefaultValues,
  verifyPhoneChangeDefaultValues,
} from "../init"
import {
  requestPhoneChangeSchema,
  verifyPhoneChangeSchema,
} from "../schema"

type RequestForm = z.infer<typeof requestPhoneChangeSchema>
type VerifyForm = z.infer<typeof verifyPhoneChangeSchema>

type Step = "request" | "verify" | "done"

export default function PhoneChangeCard() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()

  const [step, setStep] = React.useState<Step>("request")
  const [pendingPhone, setPendingPhone] = React.useState("")

  const requestForm = useForm<RequestForm>({
    resolver: zodResolver(requestPhoneChangeSchema),
    defaultValues: requestPhoneChangeDefaultValues,
  })

  const verifyForm = useForm<VerifyForm>({
    resolver: zodResolver(verifyPhoneChangeSchema),
    defaultValues: verifyPhoneChangeDefaultValues,
  })

  const requestMutation = useMutation({
    ...getRequestPhoneChangeMutationOptions(),
    onSuccess: (_, variables) => {
      setPendingPhone(variables.newPhone)
      verifyForm.reset({ newPhone: variables.newPhone, otpCode: "" })
      setStep("verify")
      toast.success("تم إرسال رمز التحقق إلى الرقم الجديد")
    },
  })

  const verifyMutation = useMutation({
    ...getVerifyPhoneChangeMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث رقم الهاتف. تم إنهاء جميع الجلسات الأخرى.")
        setStep("done")
      },
    }),
  })

  if (step === "done") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-green-600" />
            <CardTitle>تم تحديث رقم الهاتف</CardTitle>
          </div>
          <CardDescription>
            رقم الهاتف الجديد:&nbsp;
            <span className="font-mono" dir="ltr">
              {pendingPhone}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            لأمانك، تم إنهاء جميع الجلسات الأخرى. ستحتاج لإعادة تسجيل الدخول على الأجهزة الأخرى.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => {
              requestForm.reset(requestPhoneChangeDefaultValues)
              verifyForm.reset(verifyPhoneChangeDefaultValues)
              setPendingPhone("")
              setStep("request")
            }}
          >
            تغيير الرقم مرة أخرى
          </Button>
        </CardFooter>
      </Card>
    )
  }

  if (step === "verify") {
    return (
      <Card>
        <form onSubmit={verifyForm.handleSubmit((data) => verifyMutation.mutate(data))}>
          <CardHeader>
            <CardTitle>تأكيد الرقم الجديد</CardTitle>
            <CardDescription>
              أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه إلى&nbsp;
              <span className="font-mono" dir="ltr">
                {pendingPhone}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <input type="hidden" {...verifyForm.register("newPhone")} />

            <UiField data-invalid={Boolean(verifyForm.formState.errors.otpCode)}>
              <FieldLabel htmlFor="phone-change-otp">رمز التحقق</FieldLabel>
              <Controller
                name="otpCode"
                control={verifyForm.control}
                render={({ field }) => (
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      maxLength={6}
                      id="phone-change-otp"
                      value={field.value}
                      onChange={field.onChange}
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
                )}
              />
              <FieldError errors={[verifyForm.formState.errors.otpCode]} />
            </UiField>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                verifyForm.reset(verifyPhoneChangeDefaultValues)
                setStep("request")
              }}
            >
              رجوع
            </Button>
            <Button
              type="submit"
              loading={verifyMutation.isPending}
              disabled={verifyForm.watch("otpCode")?.length !== 6}
            >
              تأكيد التغيير
              <ArrowLeftIcon />
            </Button>
          </CardFooter>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={requestForm.handleSubmit((data) => requestMutation.mutate(data))}>
        <CardHeader>
          <CardTitle>تغيير رقم الهاتف</CardTitle>
          <CardDescription>
            سيتم إرسال رمز تحقق إلى الرقم الجديد لتأكيد التغيير. عند النجاح يتم
            إنهاء جميع جلساتك الأخرى تلقائياً.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {user?.username && (
            <UiField>
              <FieldLabel htmlFor="current-phone">الرقم الحالي</FieldLabel>
              <Input
                id="current-phone"
                value={user.username}
                disabled
                dir="ltr"
              />
            </UiField>
          )}

          <PhoneField<RequestForm>
            name="newPhone"
            control={requestForm.control}
            placeholder="9XX XXX XXX"
            label={
              <>
                <PhoneIcon className="size-4" />
                الرقم الجديد
              </>
            }
            disabled={requestMutation.isPending}
          />
        </CardContent>

        <CardFooter className="justify-end">
          <Button type="submit" loading={requestMutation.isPending}>
            إرسال رمز التحقق
            <ArrowLeftIcon />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
