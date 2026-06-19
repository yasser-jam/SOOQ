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

function StoreSettingsForm({
  settings,
}: {
  settings: StoreSettingsResponseDto
}) {
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

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              إعدادات المتجر
            </h1>
            <p className="text-base font-medium text-muted-foreground">
              الملف العام والعنوان والمنطقة الزمنية وغير ذلك. متاحة لمالكي
              المتجر والمدراء فقط.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={isPending || !form.formState.isDirty}
            >
              تراجع عن التغييرات
            </Button>
            <Button
              type="submit"
              loading={isPending}
              disabled={isPending || !form.formState.isDirty}
            >
              حفظ كل الإعدادات
            </Button>
          </div>
        </header>

        <Tabs defaultValue="general" className="flex flex-col gap-0">
          <TabsList
            variant="outline"
            className="w-full justify-start overflow-x-auto"
          >
            <TabsTrigger value="general">عام</TabsTrigger>
            <TabsTrigger value="currency">العملة والتوقيت</TabsTrigger>
            <TabsTrigger value="location">الموقع</TabsTrigger>
            <TabsTrigger value="hours">ساعات العمل</TabsTrigger>
            <TabsTrigger value="danger">منطقة الخطر</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="grid gap-4 lg:grid-cols-2">
            <IdentityTab settings={settings} />
            <BrandingTab />

            <GeneralTab />
            <SocialLinksTab />
          </TabsContent>

          <TabsContent value="currency" className="grid gap-4 lg:grid-cols-2">
            <CurrencyDisplayTab />
            <LocaleTab />
          </TabsContent>

          <TabsContent value="location">
            <AddressTab />
          </TabsContent>

          <TabsContent value="hours">
            <BusinessHoursTab />
          </TabsContent>

          <TabsContent value="danger">
            <DangerZoneTab settings={settings} />
          </TabsContent>
        </Tabs>
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
    <div className="container flex min-h-screen flex-col gap-4 py-8">
      <RequireRole roles={["OWNER", "MANAGER"]}>
        <StoreSettingsContent />
      </RequireRole>
    </div>
  )
}
