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

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 pb-24"
        noValidate
      >
        <Tabs defaultValue="identity" className="w-full">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="identity">الهوية</TabsTrigger>
            <TabsTrigger value="general">عام</TabsTrigger>
            <TabsTrigger value="address">العنوان</TabsTrigger>
            <TabsTrigger value="branding">الشعار</TabsTrigger>
            <TabsTrigger value="currency">العملة</TabsTrigger>
            <TabsTrigger value="locale">المنطقة الزمنية</TabsTrigger>
            <TabsTrigger value="social">روابط التواصل</TabsTrigger>
            <TabsTrigger value="hours">ساعات العمل</TabsTrigger>
            <TabsTrigger value="danger" className="text-destructive">
              منطقة الخطر
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity">
            <IdentityTab settings={settings} />
          </TabsContent>
          <TabsContent value="general">
            <GeneralTab settings={settings} />
          </TabsContent>
          <TabsContent value="address">
            <AddressTab settings={settings} />
          </TabsContent>
          <TabsContent value="branding">
            <BrandingTab settings={settings} />
          </TabsContent>
          <TabsContent value="currency">
            <CurrencyDisplayTab settings={settings} />
          </TabsContent>
          <TabsContent value="locale">
            <LocaleTab settings={settings} />
          </TabsContent>
          <TabsContent value="social">
            <SocialLinksTab settings={settings} />
          </TabsContent>
          <TabsContent value="hours">
            <BusinessHoursTab settings={settings} />
          </TabsContent>
          <TabsContent value="danger">
            {/* Danger zone uses its own mutations (deletion request /
                cancel) and is intentionally outside the shared save. */}
            <DangerZoneTab settings={settings} />
          </TabsContent>
        </Tabs>

        {/* Sticky save bar — covers every tab except Danger. */}
        <div className="sticky bottom-0 z-10 border-t bg-background/95 px-2 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 -mx-2 flex items-center justify-end gap-2">
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
    <div className="container flex flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">إعدادات المتجر</h1>
        <p className="text-sm text-muted-foreground">
          الملف العام والعنوان والمنطقة الزمنية وغير ذلك. متاحة لمالكي المتجر والمدراء فقط.
        </p>
      </header>

      <RequireRole roles={["OWNER", "MANAGER"]}>
        <StoreSettingsContent />
      </RequireRole>
    </div>
  )
}
