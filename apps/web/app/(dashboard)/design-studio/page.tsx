"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  Loader2,
  Monitor,
  MoreVertical,
  Palette,
  Pencil,
  Send,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { AppBuildCard } from "@/modules/app/build/components/app-build-card"
import { useStorePath } from "@/lib/store-path"
import RequireRole from "@/modules/auth/auth/components/RequireRole"
import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"
import { buildStoreBasePath } from "@/modules/storefront/lib/store-config"
import { getStoreSettingsQueryOptions } from "@/modules/store/settings/actions"

import ThemeMarketplaceCard from "./_components/theme-marketplace-card"
import { ThemeOnboardingDialog } from "./_components/theme-onboarding-dialog"
import {
  buildStudioMobileEditHref,
  themeNameToStudioSegment,
} from "@/lib/design-studio-paths"
import {
  getDesignDraftQueryOptions,
  listDesignVersionsQueryOptions,
  listMineTemplatesQueryOptions,
  createMineTemplate,
  updateMineTemplate,
  deleteMineTemplate,
  publishDesign,
} from "@/modules/design-studio/actions"
import { designStudioKeys } from "@/modules/design-studio/queryKeys"
import {
  applyStudioTemplate,
  readDraftTemplateKey,
  resolveActiveThemeName,
  syncSelectedThemeCache,
  useStudioTemplates,
  type StudioTemplateCard,
} from "@/modules/design-studio/templates"
import type {
  CreateMineTemplateInput,
  TenantTemplateDetail,
  UpdateMineTemplateInput,
} from "@/modules/design-studio/types"
import { humanizeError } from "@/lib/error-codes"

type MineTemplateFormState = {
  templateName: string
  templateKey: string
  industryType: string
  previewImageUrl: string
}

const slugifyTemplateKey = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")

const buildMineTemplateDefaults = (
  templateName: string,
  previewImageUrl?: string | null
): MineTemplateFormState => ({
  templateName,
  templateKey: slugifyTemplateKey(templateName),
  industryType: "",
  previewImageUrl: previewImageUrl ?? "",
})

export default function DesignStudioPage() {
  const { hasRole } = useCurrentUser()
  const canWrite = hasRole(["OWNER", "MANAGER"])
  const storePath = useStorePath()
  const queryClient = useQueryClient()
  const { data: settings, isPending: isSettingsPending } = useQuery(
    getStoreSettingsQueryOptions()
  )
  const { templates, isPending: isTemplatesPending } = useStudioTemplates()
  const { data: draft, isPending: isDraftPending } = useQuery(
    getDesignDraftQueryOptions()
  )
  const { data: versions = [] } = useQuery(listDesignVersionsQueryOptions())
  const { data: mineTemplates = [] } = useQuery(listMineTemplatesQueryOptions())
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [mineTemplateOpen, setMineTemplateOpen] = useState(false)
  const [editingMineTemplate, setEditingMineTemplate] =
    useState<TenantTemplateDetail | null>(null)
  const [mineTemplateForm, setMineTemplateForm] = useState<MineTemplateFormState>(
    buildMineTemplateDefaults("", "")
  )
  const [mineTemplateSubmitting, setMineTemplateSubmitting] = useState(false)
  const [mineTemplateError, setMineTemplateError] = useState<string | null>(null)

  const applyTemplateMutation = useMutation({
    mutationFn: applyStudioTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
      toast.success("تم تطبيق القالب. افتح المحرر لتخصيصه.")
    },
    onError: (error: { errorCode?: string; message?: string }) => {
      toast.error(humanizeError(error?.errorCode, error?.message))
    },
  })

  const publishMutation = useMutation({
    mutationFn: publishDesign,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
      toast.success("تم نشر التصميم.")
    },
    onError: (error: { errorCode?: string; message?: string }) => {
      toast.error(humanizeError(error?.errorCode, error?.message))
    },
  })

  const saveMineTemplate = useMutation({
    mutationFn: async (input: {
      mode: "create" | "edit"
      payload: CreateMineTemplateInput | UpdateMineTemplateInput
    }) => {
      if (input.mode === "create") {
        return createMineTemplate(input.payload as CreateMineTemplateInput)
      }
      return updateMineTemplate(input.payload as UpdateMineTemplateInput)
    },
    onMutate: () => {
      setMineTemplateSubmitting(true)
      setMineTemplateError(null)
    },
    onSettled: () => {
      setMineTemplateSubmitting(false)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.mineTemplates })
      toast.success("تم حفظ القالب في مكتبتي الخاصة.")
      setMineTemplateOpen(false)
      setEditingMineTemplate(null)
    },
    onError: (error: { errorCode?: string; message?: string }) => {
      const message = humanizeError(error?.errorCode, error?.message)
      setMineTemplateError(message)
      toast.error(message)
    },
  })

  const deleteMineTemplateMutation = useMutation({
    mutationFn: deleteMineTemplate,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
      await queryClient.invalidateQueries({ queryKey: designStudioKeys.mineTemplates })
      toast.success("تم حذف القالب الخاص.")
    },
    onError: (error: { errorCode?: string; message?: string }) => {
      toast.error(humanizeError(error?.errorCode, error?.message))
    },
  })

  const editorBase = storePath("/design-studio")
  const activeTemplateKey = readDraftTemplateKey(draft)
  const activeTemplate: StudioTemplateCard | null = useMemo(() => {
    if (!activeTemplateKey) return null
    return templates.find((t) => t.templateKey === activeTemplateKey) ?? null
  }, [activeTemplateKey, templates])

  const applyingTemplateKey = applyTemplateMutation.isPending
    ? applyTemplateMutation.variables?.templateKey
    : null

  const mineTemplateByTemplateId = useMemo(() => {
    const map = new Map<string, TenantTemplateDetail>()
    mineTemplates.forEach((template) => map.set(template.templateId, template))
    return map
  }, [mineTemplates])

  const activeThemeName = resolveActiveThemeName(draft, templates)

  useEffect(() => {
    syncSelectedThemeCache(draft, templates)
  }, [draft, templates])

  const publishedVersionNumber = useMemo(() => {
    const published = versions
      .filter((v) => v.lifecycleStatus === "PUBLISHED")
      .map((v) => v.versionNumber ?? 0)
    return published.length > 0 ? Math.max(...published) : null
  }, [versions])

  const themeSegment = themeNameToStudioSegment(
    activeThemeName || "Theme 1"
  )
  const themeEditHref = `${editorBase}/${themeSegment}/edit`
  const themeMobileEditHref = buildStudioMobileEditHref(
    editorBase,
    activeThemeName || "Theme 1"
  )

  const openCreateMineTemplateDialog = () => {
    const baseName = activeThemeName || draft?.configJson?.templateKey || "قالب جديد"
    setEditingMineTemplate(null)
    setMineTemplateForm(
      buildMineTemplateDefaults(baseName, activeTemplate?.previewImageUrl ?? null)
    )
    setMineTemplateError(null)
    setMineTemplateOpen(true)
  }

  const openEditMineTemplateDialog = (template: TenantTemplateDetail) => {
    setEditingMineTemplate(template)
    setMineTemplateForm({
      templateName: template.templateName,
      templateKey: template.templateKey,
      industryType: template.industryType ?? "",
      previewImageUrl: template.previewImageUrl ?? "",
    })
    setMineTemplateError(null)
    setMineTemplateOpen(true)
  }

  const submitMineTemplate = () => {
    if (!canWrite) return

    const templateName = mineTemplateForm.templateName.trim()
    const templateKey = slugifyTemplateKey(mineTemplateForm.templateKey || templateName)

    if (!templateName || !templateKey) {
      setMineTemplateError("الاسم والمفتاح مطلوبان")
      return
    }

    const payloadBase = {
      templateName,
      templateKey,
      industryType: mineTemplateForm.industryType.trim() || null,
      previewImageUrl: mineTemplateForm.previewImageUrl.trim() || null,
    }

    if (editingMineTemplate) {
      saveMineTemplate.mutate({
        mode: "edit",
        payload: {
          templateId: editingMineTemplate.templateId,
          ...payloadBase,
          isActive: editingMineTemplate.isActive,
        },
      })
      return
    }

    saveMineTemplate.mutate({
      mode: "create",
      payload: payloadBase,
    })
  }

  const toggleMineTemplateActive = (template: TenantTemplateDetail) => {
    if (!canWrite) return
    updateMineTemplate({
      templateId: template.templateId,
      templateName: template.templateName,
      templateKey: template.templateKey,
      industryType: template.industryType,
      previewImageUrl: template.previewImageUrl,
      isActive: !template.isActive,
    })
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: designStudioKeys.all })
        await queryClient.invalidateQueries({ queryKey: designStudioKeys.mineTemplates })
        toast.success(template.isActive ? "تم إلغاء التفعيل." : "تم تفعيل القالب.")
      })
      .catch((error: { errorCode?: string; message?: string }) => {
        toast.error(humanizeError(error?.errorCode, error?.message))
      })
  }

  const handleDeleteMineTemplate = (template: TenantTemplateDetail) => {
    if (!canWrite) return
    if (!window.confirm(`حذف القالب الخاص "${template.templateName}" نهائياً؟`)) return
    deleteMineTemplateMutation.mutate(template.templateId)
  }

  const renderMineTemplateActions = (template: StudioTemplateCard) => {
    if (!canWrite || !template.templateId) return null
    const detail = mineTemplateByTemplateId.get(template.templateId)
    if (!detail) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-full border-border/60 bg-background/90 backdrop-blur-sm"
            onClick={(event) => event.stopPropagation()}
            aria-label="إجراءات القالب"
          >
            <MoreVertical className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => toggleMineTemplateActive(detail)}>
            {detail.isActive ? "إلغاء التفعيل" : "تفعيل"}
          </DropdownMenuItem>
          {detail.editable && (
            <DropdownMenuItem onClick={() => openEditMineTemplateDialog(detail)}>
              <Pencil className="size-4" />
              تعديل
            </DropdownMenuItem>
          )}
          {detail.editable && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => handleDeleteMineTemplate(detail)}
            >
              <Trash2 className="size-4" />
              حذف
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const storeSlug = settings?.slug ?? ""
  const shopUrl = useMemo(() => {
    if (!storeSlug) return ""
    const path = buildStoreBasePath(storeSlug)
    if (typeof window === "undefined") return path
    return `${window.location.origin}${path}`
  }, [storeSlug])

  const hasCompletedConfig = Boolean(settings)
  const hasDraft = Boolean(draft)
  const isReady = !isDraftPending

  return (
    <RequireRole roles={["OWNER", "MANAGER", "STAFF"]}>
      <div className="container space-y-8 py-8">
      {/* Page header */}
      <header className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          استوديو التصميم
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="page-title">مصنع الثيمات</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              خصّص مظهر متجرك، راقب حالة الموقع، وعدّل الثيم الحالي من مكان
              واحد.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canWrite && hasDraft && (
              <Button
                variant="default"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                {publishMutation.isPending ? (
                  <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
                ) : (
                  <Send data-icon="inline-start" className="size-4" />
                )}
                نشر التصميم
              </Button>
            )}
            {canWrite && (
              <Button variant="secondary" onClick={() => setOnboardingOpen(true)}>
                <Sparkles data-icon="inline-start" className="size-4" />
                إنشاء ثيم مخصص
              </Button>
            )}
            {canWrite && hasDraft && (
              <Button variant="outline" onClick={openCreateMineTemplateDialog}>
                <Check data-icon="inline-start" className="size-4" />
                حفظ كقالب
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Stage 1: Store configuration not done */}
      {!hasCompletedConfig && <StoreConfigCta storePath={storePath} />}

      {/* Stage 2: Config done, no design draft yet */}
      {hasCompletedConfig && isReady && !hasDraft && canWrite && <NoThemeCta />}
      {hasCompletedConfig && isReady && !hasDraft && !canWrite && <ReadOnlyCta />}

      {/* Draft still loading */}
      {hasCompletedConfig && !isReady && <ActiveThemeCardSkeleton />}

      {/* Stage 3: Active design hero */}
      {hasDraft && draft && (
        <ActiveThemeCard
          themeName={activeThemeName}
          previewImageUrl={activeTemplate?.previewImageUrl ?? null}
          draftVersionNumber={draft.versionNumber}
          publishedVersionNumber={publishedVersionNumber}
          lifecycleStatus={draft.lifecycleStatus}
          themeEditHref={themeEditHref}
          themeMobileEditHref={themeMobileEditHref}
          shopUrl={shopUrl}
          canWrite={canWrite}
          isPending={isSettingsPending}
        />
      )}

      {/* Template marketplace */}
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-text text-xl font-semibold">قوالب التصميم</h2>
          <p className="text-sm text-muted-foreground">
            استكشف القوالب النظامية وقوالبك الخاصة، وطبّق ما يناسب متجرك.
          </p>
        </div>

        {isTemplatesPending ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <Card className="border border-border/60">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              لا توجد قوالب متاحة حالياً.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {templates.map((template) => (
              <ThemeMarketplaceCard
                key={`${template.source}:${template.templateId ?? template.templateKey}`}
                title={template.templateName}
                description={template.description}
                previewImage={template.previewImageUrl ?? undefined}
                isActive={activeTemplateKey === template.templateKey}
                isApplying={applyingTemplateKey === template.templateKey}
                applyDisabled={
                  applyTemplateMutation.isPending &&
                  applyingTemplateKey !== template.templateKey
                }
                badge={
                  template.source === "SYSTEM"
                    ? "نظامي"
                    : template.source === "MINE"
                      ? "قالبي"
                      : "محلي"
                }
                actions={renderMineTemplateActions(template)}
                onSelect={
                  canWrite ? () => {
                    if (hasDraft && !window.confirm("سيتم استبدال المسودة الحالية بهذا القالب. هل تريد المتابعة؟")) {
                      return
                    }
                    applyTemplateMutation.mutate(template)
                  } : undefined
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Mobile app section */}
      <section className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-text text-xl font-semibold">تطبيق الجوال</h2>
          <p className="text-sm text-muted-foreground">
            أنشئ تطبيق جوال لمتجرك بنقرة واحدة وتابع عدد التثبيتات.
          </p>
        </div>
        <AppBuildCard />
      </section>

      {/* Onboarding dialog */}
      <ThemeOnboardingDialog
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
      />
      <MineTemplateDialog
        open={mineTemplateOpen}
        onOpenChange={(open) => {
          setMineTemplateOpen(open)
          if (!open) {
            setEditingMineTemplate(null)
            setMineTemplateError(null)
          }
        }}
        isSubmitting={mineTemplateSubmitting || saveMineTemplate.isPending}
        errorMessage={mineTemplateError}
        form={mineTemplateForm}
        setForm={setMineTemplateForm}
        onSubmit={submitMineTemplate}
        mode={editingMineTemplate ? "edit" : "create"}
      />
      </div>
    </RequireRole>
  )
}

function MineTemplateDialog({
  open,
  onOpenChange,
  isSubmitting,
  errorMessage,
  form,
  setForm,
  onSubmit,
  mode,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSubmitting: boolean
  errorMessage: string | null
  form: MineTemplateFormState
  setForm: (updater: MineTemplateFormState | ((prev: MineTemplateFormState) => MineTemplateFormState)) => void
  onSubmit: () => void
  mode: "create" | "edit"
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogTitle>{mode === "create" ? "حفظ كقالب" : "تعديل القالب"}</DialogTitle>
        <DialogDescription>
          احفظ المسودة الحالية في مكتبتك الخاصة أو عدّل بيانات القالب الحالي.
        </DialogDescription>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="mine-template-name">اسم القالب</Label>
            <Input
              id="mine-template-name"
              value={form.templateName}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  templateName: event.target.value,
                  templateKey: prev.templateKey || slugifyTemplateKey(event.target.value),
                }))
              }
              placeholder="مثال: متجر أنيق"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mine-template-key">مفتاح القالب</Label>
            <Input
              id="mine-template-key"
              value={form.templateKey}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, templateKey: slugifyTemplateKey(event.target.value) }))
              }
              placeholder="store-theme"
              dir="ltr"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="mine-template-industry">نوع النشاط</Label>
              <Input
                id="mine-template-industry"
                value={form.industryType}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, industryType: event.target.value }))
                }
                placeholder="ملابس، إلكترونيات..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mine-template-preview">رابط المعاينة</Label>
              <Input
                id="mine-template-preview"
                value={form.previewImageUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, previewImageUrl: event.target.value }))
                }
                placeholder="https://..."
                dir="ltr"
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "create" ? "حفظ القالب" : "حفظ التعديلات"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stage 1: Config CTA ─────────────────────────────────────────────────────

function StoreConfigCta({ storePath }: { storePath: (p: string) => string }) {
  return (
    <Card className="border border-border/60">
      <CardContent className="py-6">
        <div className="grid grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <CardTitle className="mb-1 text-xl">
              أكمل إعداد هوية متجرك
            </CardTitle>
            <CardDescription className="mb-4 text-sm leading-relaxed">
              قبل اختيار ثيم أو تخصيص التصميم، نحتاج بعض المعلومات الأساسية عن
              علامتك التجارية.
            </CardDescription>

            <div className="mb-5 space-y-2">
              <StepItem done label="اسم المتجر" />
              <StepItem label="رفع الشعار" number={2} />
              <StepItem label="اختيار لوحة الألوان" number={3} />
              <StepItem label="اختيار الخط المفضّل" number={4} />
            </div>

            <div className="flex items-center gap-3">
              <Button variant="secondary" asChild>
                <Link href={storePath("/settings")}>متابعة الإعداد</Link>
              </Button>
              <Button variant="ghost" size="sm">
                تخطّي والاختيار لاحقاً
              </Button>
            </div>
          </div>

          <div className="flex size-32 flex-col items-center justify-center gap-2 rounded-full border-2 border-dashed border-border bg-muted/30">
            <div className="flex gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="size-3.5" />
              </span>
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <Palette className="size-3.5" />
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              هوية المتجر
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StepItem({
  done,
  label,
  number,
}: {
  done?: boolean
  label: string
  number?: number
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex size-6 items-center justify-center rounded-full text-xs font-medium",
          done
            ? "bg-emerald-50 text-emerald-600"
            : "border border-border bg-background text-muted-foreground"
        )}
      >
        {done ? <Check className="size-3.5" /> : number}
      </span>
      <span
        className={cn(
          "text-sm",
          done && "text-muted-foreground line-through"
        )}
      >
        {label}
      </span>
    </div>
  )
}

// ─── Stage 2: No Theme CTA ──────────────────────────────────────────────────

function NoThemeCta() {
  return (
    <Card className="border border-border/60">
      <CardContent className="py-6">
        <div className="grid grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <CardTitle className="mb-1 text-xl">اختر قالباً لمتجرك</CardTitle>
            <CardDescription className="mb-4 text-sm leading-relaxed">
              اختر أحد القوالب الجاهزة أدناه كنقطة انطلاق، ثم خصّصه كما تريد
              من محرر التصميم.
            </CardDescription>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="primary">
                <Sparkles className="size-3" /> قوالب من الخادم
              </Badge>
              <Badge variant="outline">تخصيص كامل بعد الاختيار</Badge>
            </div>
            <Button variant="secondary">
              <ArrowUpRight data-icon="inline-start" className="size-4" />
              استعرض القوالب
            </Button>
          </div>

          {/* Fanned cards visual */}
          <div className="relative flex size-36 items-center justify-center">
            {[-12, 4, -2].map((rot, i) => (
              <div
                key={i}
                className="absolute h-24 w-[72px] rounded-lg border bg-background p-2 shadow-sm"
                style={{
                  transform: `rotate(${rot}deg) translate(${i === 0 ? "-10px" : i === 1 ? "10px" : "0"}, ${i === 2 ? "0" : "4px"})`,
                  opacity: i === 2 ? 1 : 0.6,
                  zIndex: i === 2 ? 1 : 0,
                }}
              >
                <div className="h-2 w-full rounded-sm bg-muted" />
                <div className="mt-1 h-1.5 w-3/5 rounded-sm bg-muted" />
                <div className="mt-2 flex-1 rounded border bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ReadOnlyCta() {
  return (
    <Card className="border border-border/60">
      <CardContent className="py-6">
        <div className="flex items-center justify-between gap-6">
          <div>
            <CardTitle className="mb-1 text-xl">وضع القراءة فقط</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              يمكنك استعراض القوالب والمسودة الحالية، لكن التعديل والنشر متاحان فقط لمالك المتجر أو المدير.
            </CardDescription>
          </div>
          <Badge variant="outline">STAFF</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Stage 3: Active Theme Hero ──────────────────────────────────────────────

function ActiveThemeCard({
  themeName,
  previewImageUrl,
  draftVersionNumber,
  publishedVersionNumber,
  lifecycleStatus,
  themeEditHref,
  themeMobileEditHref,
  shopUrl,
  canWrite,
  isPending,
}: {
  themeName: string
  previewImageUrl: string | null
  draftVersionNumber: number | null
  publishedVersionNumber: number | null
  lifecycleStatus: string
  themeEditHref: string
  themeMobileEditHref: string
  shopUrl: string
  canWrite: boolean
  isPending: boolean
}) {
  const statusLabel =
    lifecycleStatus === "PUBLISHED"
      ? "منشور"
      : lifecycleStatus === "DRAFT"
        ? "مسودة"
        : lifecycleStatus
  return (
    <Card className="overflow-hidden border border-border/60 p-0">
      {/* Two-column: image (inline-start / right in RTL) | info */}
      <div className="flex flex-wrap">
        {/* Image side – first in DOM → inline-start (right in RTL) */}
        <div className="relative min-h-[280px] basis-80 flex-shrink-0 bg-gradient-to-br from-stone-100 via-background to-amber-50/30">
          <span className="absolute start-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-emerald-600">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {statusLabel}
          </span>

          {previewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImageUrl}
              alt={themeName}
              className="size-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[170px] overflow-hidden rounded-lg border bg-background shadow-sm">
                <div className="h-5 bg-primary" />
                <div className="space-y-2 p-2">
                  <div className="h-10 rounded border border-dashed bg-muted/30" />
                  <div className="h-1.5 w-4/5 rounded-full bg-foreground/10" />
                  <div className="h-1.5 w-3/5 rounded-full bg-foreground/10" />
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-8 rounded border bg-muted/20" />
                    <div className="h-8 rounded border bg-muted/20" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info side */}
        <div className="flex min-w-80 flex-1 flex-col gap-5 p-7">
          <div>
            <Badge variant="secondary-tonal" className="mb-3">
              <Palette className="size-3" /> التصميم النشط
            </Badge>
            <h2 className="mb-2 text-2xl font-extrabold">{themeName}</h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {publishedVersionNumber
                ? `آخر إصدار منشور: v${publishedVersionNumber}`
                : "لم يتم النشر بعد. استكمل التخصيص من المحرر ثم اضغط نشر."}
              {draftVersionNumber ? ` · المسودة v${draftVersionNumber}` : ""}
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-auto flex flex-wrap gap-2.5 pt-2">
            {canWrite && (
              <Button variant="secondary" asChild>
                <Link href={themeMobileEditHref}>
                  <Smartphone data-icon="inline-start" className="size-4" />
                  محرر الجوال
                </Link>
              </Button>
            )}
            {canWrite && (
              <Button asChild>
                <Link href={themeEditHref}>
                  <Monitor data-icon="inline-start" className="size-4" />
                  محرر سطح المكتب
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Store URL footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-8 py-4">
        <span className="text-sm text-muted-foreground">رابط المتجر</span>
        {isPending ? (
          <Skeleton className="h-4 w-48" />
        ) : shopUrl ? (
          <a
            href={shopUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            dir="ltr"
          >
            {shopUrl.replace(/^https?:\/\//, "")}
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">
            أكمل إعداد المتجر لعرض الرابط العام.
          </span>
        )}
      </div>
    </Card>
  )
}

function ActiveThemeCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/60 p-0">
      <div className="flex flex-wrap">
        <Skeleton className="min-h-[280px] basis-80 flex-shrink-0 rounded-none" />
        <div className="flex min-w-80 flex-1 flex-col gap-5 p-7">
          <div className="space-y-3">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="mt-auto flex flex-wrap gap-2.5 pt-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 px-8 py-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-48" />
      </div>
    </Card>
  )
}

