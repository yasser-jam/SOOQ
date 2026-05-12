"use client"

import { useQuery } from "@tanstack/react-query"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import RequireRole from "@/modules/auth/auth/components/RequireRole"
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"
import AddressTab from "@/modules/store/settings/components/AddressTab"
import BrandingTab from "@/modules/store/settings/components/BrandingTab"
import BusinessHoursTab from "@/modules/store/settings/components/BusinessHoursTab"
import CurrencyDisplayTab from "@/modules/store/settings/components/CurrencyDisplayTab"
import DangerZoneTab from "@/modules/store/settings/components/DangerZoneTab"
import GeneralTab from "@/modules/store/settings/components/GeneralTab"
import LocaleTab from "@/modules/store/settings/components/LocaleTab"
import SocialLinksTab from "@/modules/store/settings/components/SocialLinksTab"

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

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="flex-wrap h-auto">
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

      <TabsContent value="general">
        <GeneralTab settings={data} />
      </TabsContent>
      <TabsContent value="address">
        <AddressTab settings={data} />
      </TabsContent>
      <TabsContent value="branding">
        <BrandingTab settings={data} />
      </TabsContent>
      <TabsContent value="currency">
        <CurrencyDisplayTab settings={data} />
      </TabsContent>
      <TabsContent value="locale">
        <LocaleTab settings={data} />
      </TabsContent>
      <TabsContent value="social">
        <SocialLinksTab settings={data} />
      </TabsContent>
      <TabsContent value="hours">
        <BusinessHoursTab settings={data} />
      </TabsContent>
      <TabsContent value="danger">
        <DangerZoneTab settings={data} />
      </TabsContent>
    </Tabs>
  )
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
