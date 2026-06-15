"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import * as React from "react"

import type { ApiError } from "@/lib/api"
import RequireRole from "@/modules/auth/auth/components/RequireRole"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"
import {
  getStoreSettingsQueryOptions,
  getUpdateStoreSettingsMutationOptions,
} from "@/modules/store/settings/actions"
import AddressTab from "@/modules/store/settings/components/AddressTab"
import BrandingTab from "@/modules/store/settings/components/BrandingTab"
import BusinessHoursTab from "@/modules/store/settings/components/BusinessHoursTab"
import CurrencyDisplayTab from "@/modules/store/settings/components/CurrencyDisplayTab"
import DangerZoneTab from "@/modules/store/settings/components/DangerZoneTab"
import GeneralTab from "@/modules/store/settings/components/GeneralTab"
import IdentityTab from "@/modules/store/settings/components/IdentityTab"
import LocaleTab from "@/modules/store/settings/components/LocaleTab"
import SocialLinksTab from "@/modules/store/settings/components/SocialLinksTab"
import {
  buildAllSettingsDefaults,
  diffSettingsPayload,
} from "@/modules/store/settings/init"
import { allSettingsSchema } from "@/modules/store/settings/schema"
import type {
  AllSettingsInput,
  StoreSettingsResponseDto,
} from "@/modules/store/settings/types"

function StoreSettingsForm({ settings }: { settings: StoreSettingsResponseDto }) {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()

  const form = useForm<AllSettingsInput>({
    resolver: zodResolver(allSettingsSchema),
    defaultValues: buildAllSettingsDefaults(settings, user?.phone),
    mode: "onChange",
  })

  const { isPending, mutate } = useMutation({
    ...getUpdateStoreSettingsMutationOptions({
      queryClient,
      onSuccess: (updated) => {
        toast.success("تم حفظ الإعدادات")
        // Re-seed the form from the freshest server state so the
        // "dirty" tracker resets and the diff next time is correct.
        form.reset(buildAllSettingsDefaults(updated, user?.phone))
      },
    }),
    onError: (error: ApiError) => {
      if (error?.errorCode === "ERR_1003" && error?.fieldKey === "slug") {
        form.setError("slug", {
          type: "taken",
          message: "هذا الرابط محجوز، اختر رابطاً آخر",
        })
      }
    },
  })

  const onSubmit = (values: AllSettingsInput) => {
    const payload = diffSettingsPayload(values, settings)
    if (Object.keys(payload).length === 0) {
      toast.info("لا تغييرات للحفظ")
      return
    }
    mutate(payload)
  }

  const handleDiscard = () => {
    form.reset(buildAllSettingsDefaults(settings, user?.phone))
  }

  const [showAdvanced, setShowAdvanced] = React.useState(false)

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 pb-24"
        noValidate
      >
        {/* Bento Grid Layout - تجميع الإعدادات المترابطة في بطاقات */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* بطاقة هوية المتجر - الاسم، الرابط، العملة */}
          <div className="md:col-span-2 lg:col-span-2">
            <IdentityTab settings={settings} />
          </div>

          {/* بطاقة الشعار */}
          <div>
            <BrandingTab settings={settings} />
          </div>

          {/* بطاقة الملف العام */}
          <div className="md:col-span-2 lg:col-span-2">
            <GeneralTab settings={settings} />
          </div>

          {/* بطاقة العمليات - عرض العملة والمنطقة الزمنية */}
          <div className="flex flex-col gap-6">
            <CurrencyDisplayTab settings={settings} />
            <LocaleTab settings={settings} />
          </div>

          {/* بطاقة العنوان */}
          <div className="md:col-span-2 lg:col-span-3">
            <AddressTab settings={settings} />
          </div>

          {/* بطاقة ساعات العمل */}
          <div className="md:col-span-2 lg:col-span-2">
            <BusinessHoursTab settings={settings} />
          </div>

          {/* بطاقة روابط التواصل */}
          <div>
            <SocialLinksTab settings={settings} />
          </div>
        </div>

        {/* Progressive Disclosure - الإعدادات المتقدمة */}
        <div className="border-t pt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? "إخفاء الإعدادات المتقدمة" : "إظهار الإعدادات المتقدمة"}
          </Button>

          {showAdvanced && (
            <div className="mt-6">
              {/* منطقة الخطر - منفصلة عن الحفظ المشترك */}
              <DangerZoneTab settings={settings} />
            </div>
          )}
        </div>

        {/* Sticky save bar — شريط إجراءات عائم بتأثير زجاجي */}
        <div className="sticky bottom-0 z-10 border-t border-gray-200/50 bg-white/80 backdrop-blur-md px-6 py-4 shadow-lg -mx-6 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={isPending || !form.formState.isDirty}
            className="rounded-xl"
          >
            تراجع عن التغييرات
          </Button>
          <Button
            type="submit"
            loading={isPending}
            disabled={isPending || !form.formState.isDirty}
            className="rounded-xl bg-[#1e3a47] hover:bg-[#152933]"
          >
            حفظ كل الإعدادات
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}

function StoreSettingsContent() {
  const { data, isLoading, isError } = useQuery(getStoreSettingsQueryOptions())

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          تعذّر تحميل إعدادات المتجر. يرجى المحاولة مجدداً.
        </AlertDescription>
      </Alert>
    )
  }

  return <StoreSettingsForm settings={data} />
}

export default function StoreSettingsPage() {
  return (
    <div className="container flex flex-col gap-6 py-8 bg-[#F8F9FA] min-h-screen">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#1e3a47] tracking-tight">إعدادات المتجر</h1>
        <p className="text-base text-gray-600 font-medium">
          الملف العام والعنوان والمنطقة الزمنية وغير ذلك. متاحة لمالكي المتجر والمدراء فقط.
        </p>
      </header>

      <RequireRole roles={["OWNER", "MANAGER"]}>
        <StoreSettingsContent />
      </RequireRole>
    </div>
  )
}
