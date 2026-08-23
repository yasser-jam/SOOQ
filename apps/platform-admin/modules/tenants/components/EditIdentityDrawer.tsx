"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@workspace/ui/components/button"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  checkSlug,
  getUpdateIdentityMutationOptions,
  getUploadLogoMutationOptions,
} from "../actions"
import { updateIdentitySchema } from "../schema"
import type { TenantSummary, UpdateIdentityInput } from "../types"

type EditIdentityDrawerProps = {
  tenant: TenantSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditIdentityDrawer({
  tenant,
  open,
  onOpenChange,
}: EditIdentityDrawerProps) {
  const queryClient = useQueryClient()
  const [logoAssetId, setLogoAssetId] = useState<string | undefined>()

  const form = useForm<UpdateIdentityInput>({
    resolver: zodResolver(updateIdentitySchema),
    defaultValues: {
      storeName: "",
      slug: "",
      primaryCurrencyCode: "SYP",
      logoAssetId: "",
    },
  })

  useEffect(() => {
    if (!tenant) return
    form.reset({
      storeName: tenant.storeName,
      slug: tenant.slug,
      primaryCurrencyCode: tenant.primaryCurrencyCode ?? "SYP",
      logoAssetId: "",
    })
    setLogoAssetId(undefined)
  }, [tenant, form])

  const slug = form.watch("slug")
  const { data: slugCheck } = useQuery({
    queryKey: ["slug-check", tenant?.tenantId, slug],
    queryFn: () => checkSlug(slug, tenant!.tenantId),
    enabled: Boolean(tenant && slug && slug !== tenant.slug),
  })

  const uploadMutation = useMutation({
    ...getUploadLogoMutationOptions({
      onSuccess: (items) => {
        const assetId = items[0]?.assetId
        if (assetId) {
          setLogoAssetId(assetId)
          form.setValue("logoAssetId", assetId)
          toast.success("تم رفع الشعار")
        }
      },
    }),
  })

  const updateMutation = useMutation({
    ...getUpdateIdentityMutationOptions({
      queryClient,
      onSuccess: () => {
        toast.success("تم تحديث هوية المتجر")
        onOpenChange(false)
      },
    }),
  })

  const slugUnavailable =
    slugCheck && !slugCheck.available && slug !== tenant?.slug

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>تعديل هوية المتجر</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit((data) => {
            if (!tenant || slugUnavailable) return
            updateMutation.mutate({
              tenantId: tenant.tenantId,
              data: {
                ...data,
                logoAssetId: logoAssetId || data.logoAssetId || undefined,
              },
            })
          })}
          className="mt-6 space-y-4"
        >
          <UiField data-invalid={Boolean(form.formState.errors.storeName)}>
            <FieldLabel>اسم المتجر</FieldLabel>
            <Input {...form.register("storeName")} />
            <FieldError errors={[form.formState.errors.storeName]} />
          </UiField>

          <UiField data-invalid={Boolean(form.formState.errors.slug) || slugUnavailable}>
            <FieldLabel>الرابط (slug)</FieldLabel>
            <Input {...form.register("slug")} dir="ltr" />
            {slugUnavailable ? (
              <p className="text-xs text-destructive">الرابط غير متاح</p>
            ) : null}
            <FieldError errors={[form.formState.errors.slug]} />
          </UiField>

          <UiField data-invalid={Boolean(form.formState.errors.primaryCurrencyCode)}>
            <FieldLabel>العملة</FieldLabel>
            <Input {...form.register("primaryCurrencyCode")} dir="ltr" maxLength={3} />
            <FieldError errors={[form.formState.errors.primaryCurrencyCode]} />
          </UiField>

          <UiField>
            <FieldLabel>الشعار</FieldLabel>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadMutation.mutate([file])
              }}
            />
          </UiField>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              type="submit"
              loading={updateMutation.isPending}
              disabled={Boolean(slugUnavailable)}
            >
              حفظ
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
