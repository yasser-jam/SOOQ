"use client"

import { api } from "@/lib/api"
import { useMutation } from "@tanstack/react-query"

import { toast } from "sonner"

import { Field, FieldLabel, FieldError } from "@workspace/ui/components/field"

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
import { ArrowLeftIcon, PhoneIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { requestOtpSchema } from "@/lib/schema"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

export default function RequestOtpPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")

  type RequestOtpForm = z.infer<typeof requestOtpSchema>

  const form = useForm<RequestOtpForm>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: {
      phone: "",
    },
  })

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
      toast.success("تم إرسال رمز التحقق بنجاح")
    },
  })

  const handleSubmit = (data: RequestOtpForm) => {
    console.log(data);
    
    mutate()
  }

  return (
    <Card className="w-full max-w-1/3">
      <form onSubmit={form.handleSubmit(handleSubmit)}>
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
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => {
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="phone">
                        <PhoneIcon className="size-4" />
                        رقم الهاتف
                      </FieldLabel> 
                      <Input
                        {...field}
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+963 9XX XXX XXX"
                      />

                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )
                }}
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
