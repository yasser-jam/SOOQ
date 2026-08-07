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
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser"

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

export function PhoneChangeForm() {
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
          <CardDescription dir="ltr">{pendingPhone}</CardDescription>
        </CardHeader>
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
            <CardDescription dir="ltr">{pendingPhone}</CardDescription>
          </CardHeader>
          <CardContent>
            <input type="hidden" {...verifyForm.register("newPhone")} />
            <UiField data-invalid={Boolean(verifyForm.formState.errors.otpCode)}>
              <FieldLabel>رمز التحقق</FieldLabel>
              <Controller
                name="otpCode"
                control={verifyForm.control}
                render={({ field }) => (
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP maxLength={6} value={field.value} onChange={field.onChange}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} className="h-12 w-10" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}
              />
              <FieldError errors={[verifyForm.formState.errors.otpCode]} />
            </UiField>
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setStep("request")}>
              رجوع
            </Button>
            <Button
              type="submit"
              loading={verifyMutation.isPending}
              disabled={verifyForm.watch("otpCode")?.length !== 6}
            >
              تأكيد
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
            سيتم إرسال رمز تحقق إلى الرقم الجديد. عند النجاح تُنهى جميع الجلسات الأخرى.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user?.phone ? (
            <UiField>
              <FieldLabel>الرقم الحالي</FieldLabel>
              <Input value={user.phone} disabled dir="ltr" />
            </UiField>
          ) : null}
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
        <CardFooter>
          <Button type="submit" loading={requestMutation.isPending}>
            إرسال رمز التحقق
            <ArrowLeftIcon />
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
