"use client"

import { Check, Mail, MessageSquare, X } from "lucide-react"

import type { CustomerPreferences } from "@/modules/customer/customer/types"
import { formatDateArabic } from "@/modules/customer/customer/utils"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface CustomerPreferencesCardProps {
  preferences?: CustomerPreferences
  isLoading?: boolean
}

interface PreferenceRowProps {
  icon: typeof Mail
  label: string
  enabled: boolean
  consentedAt: string | null
}

function PreferenceRow({
  icon: Icon,
  label,
  enabled,
  consentedAt,
}: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">
            {consentedAt
              ? `آخر موافقة: ${formatDateArabic(consentedAt)}`
              : "لم تتم الموافقة"}
          </span>
        </div>
      </div>

      <div
        className={
          enabled
            ? "flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
            : "flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
        }
        aria-label={enabled ? "مفعّل" : "غير مفعّل"}
      >
        {enabled ? (
          <Check className="size-5" aria-hidden />
        ) : (
          <X className="size-5" aria-hidden />
        )}
      </div>
    </div>
  )
}

export default function CustomerPreferencesCard({
  preferences,
  isLoading = false,
}: CustomerPreferencesCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">تفضيلات التسويق</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        {isLoading || !preferences ? (
          <>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </>
        ) : (
          <>
            <PreferenceRow
              icon={Mail}
              label="عروض البريد الإلكتروني"
              enabled={preferences.emailOptIn}
              consentedAt={preferences.emailConsentedAt}
            />
            <PreferenceRow
              icon={MessageSquare}
              label="رسائل SMS/واتساب التسويقية"
              enabled={preferences.smsOptIn}
              consentedAt={preferences.smsConsentedAt}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
