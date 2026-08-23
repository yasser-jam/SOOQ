"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import { ShieldOffIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import ConfirmAlert from "@/components/system/ConfirmAlert"

import { getDisableTotpMutationOptions } from "../actions"

export function DisableTotpDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = React.useState(false)

  const disableMutation = useMutation({
    ...getDisableTotpMutationOptions({
      queryClient,
      onSuccess: () => toast.success("تم تعطيل المصادقة الثنائية"),
    }),
  })

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <ShieldOffIcon className="size-4" />
        تعطيل TOTP
      </Button>
      <ConfirmAlert
        open={open}
        onOpenChange={setOpen}
        title="تعطيل المصادقة الثنائية"
        description="سيتم إزالة TOTP من حسابك. هل أنت متأكد؟"
        actionLabel="تعطيل"
        variant="destructive"
        onAction={() => disableMutation.mutate()}
      />
    </>
  )
}
