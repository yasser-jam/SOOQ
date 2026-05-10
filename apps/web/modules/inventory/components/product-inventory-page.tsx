"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { Boxes, History, Info, Package, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import Field from "@/components/system/Field"
import { useStorePath } from "@/lib/store-path"
import {
  adjustInventory,
  getProductInventoryStatus,
  getVariantInventoryMovements,
} from "@/modules/inventory/actions"
import { inventoryQueryKeys } from "@/modules/inventory/queryKeys"
import type {
  InventoryMovement,
  InventoryVariantStatus,
} from "@/modules/inventory/types"
import {
  formatInventoryDateTime,
  formatInventoryMoney,
  formatInventoryQuantity,
  getInventoryHealthMeta,
  getInventoryMovementReasonLabel,
  getInventoryReferenceLabel,
  getProductStatusLabel,
} from "@/modules/inventory/utils"
import { getProduct } from "@/modules/product/product/actions"
import { productKeys } from "@/modules/product/product/queryKeys"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { FieldDescription } from "@workspace/ui/components/field"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

const movementPage = {
  page: 0,
  size: 20,
}

const adjustmentSchema = z.object({
  quantityDelta: z.coerce
    .number()
    .int("يجب إدخال رقم صحيح")
    .refine((value) => value !== 0, "قيمة التعديل يجب ألا تساوي 0"),
})

type AdjustmentFormInput = z.input<typeof adjustmentSchema>
type AdjustmentFormOutput = z.output<typeof adjustmentSchema>

const quickAdjustmentValues = [10, 50, 100, -10, -50, -100]

function InventoryMetaItem({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper?: string
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-text mt-2 text-lg font-semibold">{value}</p>
      {helper ? (
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      ) : null}
    </div>
  )
}

function InventoryStatCard({
  title,
  value,
  description,
  accentClassName,
}: {
  title: string
  value: string
  description: string
  accentClassName: string
}) {
  return (
    <Card className="gap-3 py-5">
      <CardContent className="space-y-3">
        <span
          className={cn("block h-1.5 w-16 rounded-full", accentClassName)}
        />
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-text mt-1 text-3xl font-semibold">{value}</p>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function VariantStatusCard({
  variant,
  isSelected,
  onSelect,
}: {
  variant: InventoryVariantStatus
  isSelected: boolean
  onSelect: () => void
}) {
  const health = getInventoryHealthMeta(variant)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-2xl border p-4 text-start transition-all duration-200",
        "hover:border-secondary/60 hover:bg-secondary/5",
        isSelected
          ? "border-secondary bg-secondary/10 shadow-[0_10px_24px_rgba(20,80,140,0.12)]"
          : "border-border/80 bg-background/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-text truncate text-lg font-semibold">
            {variant.sku || "متغير بدون SKU"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {variant.variantId}
          </p>
        </div>

        <Badge variant={health.badgeVariant}>{health.label}</Badge>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-text text-3xl font-semibold">
            {formatInventoryQuantity(variant.stockQty)}
          </p>
          <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {variant.allowOversell ? (
            <Badge variant="primary">يسمح بالبيع</Badge>
          ) : null}

          <span className="text-xs text-muted-foreground">
            {variant.lowStockThreshold !== null
              ? `حد التنبيه: ${formatInventoryQuantity(variant.lowStockThreshold)}`
              : "حد التنبيه غير محدد"}
          </span>
        </div>
      </div>
    </button>
  )
}

function MovementCard({ movement }: { movement: InventoryMovement }) {
  const deltaIsPositive = movement.quantityDelta > 0

  return (
    <div className="rounded-2xl border border-border/80 bg-background/70 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {getInventoryMovementReasonLabel(movement.reasonCode)}
            </Badge>
            <Badge variant="outline">
              {getInventoryReferenceLabel(movement.referenceType)}
            </Badge>
            {movement.referenceId ? (
              <Badge variant="ghost">{movement.referenceId}</Badge>
            ) : null}
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {formatInventoryDateTime(movement.createdAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              رقم الحركة: {movement.movementId}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-muted/40 px-4 py-3">
          <div>
            <p className="text-xs text-muted-foreground">التغير</p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold",
                deltaIsPositive ? "text-secondary" : "text-destructive"
              )}
            >
              {formatInventoryQuantity(movement.quantityDelta, {
                signed: true,
              })}
            </p>
          </div>

          <Separator orientation="vertical" className="hidden h-10 sm:block" />

          <div>
            <p className="text-xs text-muted-foreground">الرصيد بعد الحركة</p>
            <p className="text-text mt-1 text-lg font-semibold">
              {formatInventoryQuantity(movement.balanceAfter)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductInventoryPage() {
  const router = useRouter()
  const storePath = useStorePath()
  const params = useParams<{ "product-id": string }>()
  const queryClient = useQueryClient()
  const productId = params["product-id"]

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null
  )

  const form = useForm<AdjustmentFormInput, unknown, AdjustmentFormOutput>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      quantityDelta: 0,
    },
  })

  const {
    data: product,
    isPending: isProductLoading,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: () => getProduct(productId),
    enabled: Boolean(productId),
  })

  const {
    data: statuses = [],
    isPending: isStatusLoading,
    refetch: refetchStatuses,
  } = useQuery({
    queryKey: inventoryQueryKeys.status(productId),
    queryFn: () => getProductInventoryStatus(productId),
    enabled: Boolean(productId),
  })

  const resolvedSelectedVariantId =
    selectedVariantId &&
    statuses.some((variant) => variant.variantId === selectedVariantId)
      ? selectedVariantId
      : (statuses[0]?.variantId ?? "")

  const selectedVariant =
    statuses.find(
      (variant) => variant.variantId === resolvedSelectedVariantId
    ) ?? null

  const {
    data: movements = [],
    isPending: isMovementsLoading,
    refetch: refetchMovements,
  } = useQuery({
    queryKey: inventoryQueryKeys.movements(
      resolvedSelectedVariantId,
      movementPage
    ),
    queryFn: () =>
      getVariantInventoryMovements(resolvedSelectedVariantId, movementPage),
    enabled: Boolean(resolvedSelectedVariantId),
  })

  const { mutate: submitAdjustment, isPending: isAdjustingInventory } =
    useMutation({
      mutationFn: adjustInventory,
      onSuccess: async (_, variables) => {
        toast.success("تم تعديل المخزون بنجاح")
        form.reset({
          quantityDelta: 0,
        })

        await queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.status(productId),
        })
        await queryClient.invalidateQueries({
          queryKey: inventoryQueryKeys.movementList(variables.variantId),
        })
      },
    })

  const totalStockQty = useMemo(
    () => statuses.reduce((total, variant) => total + variant.stockQty, 0),
    [statuses]
  )
  const lowStockVariantsCount = useMemo(
    () => statuses.filter((variant) => variant.isLowStock).length,
    [statuses]
  )
  const oversellVariantsCount = useMemo(
    () => statuses.filter((variant) => variant.allowOversell).length,
    [statuses]
  )

  const selectedVariantHealth = getInventoryHealthMeta(selectedVariant)
  const optionNames =
    product?.options?.map((option) => option.optionNameAr).filter(Boolean) ?? []

  const handleAdjustmentSubmit = (data: AdjustmentFormOutput) => {
    if (!selectedVariant) {
      toast.error("اختر متغيراً أولاً قبل تعديل المخزون")
      return
    }

    submitAdjustment({
      variantId: selectedVariant.variantId,
      quantityDelta: data.quantityDelta,
      reasonCode: "MANUAL_ADJUSTMENT",
    })
  }

  const handleRefresh = async () => {
    await Promise.all([
      refetchProduct(),
      refetchStatuses(),
      resolvedSelectedVariantId ? refetchMovements() : Promise.resolve(),
    ])
  }

  return (
    <div className="container my-6 flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="page-title">مخزون المنتج</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            راقب رصيد المتغيرات، استعرض الحركات، ونفذ التعديلات اليدوية من مكان
            واحد.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" asChild>
            <Link href={storePath(`/products/${productId}`)}>العودة إلى المنتج</Link>
          </Button>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            loading={isProductLoading || isStatusLoading || isMovementsLoading}
          >
            تحديث البيانات
            <RefreshCw data-icon="inline-end" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden bg-[linear-gradient(135deg,rgba(18,38,64,0.08),rgba(255,255,255,0.96))]">
        <CardContent className="pt-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <Avatar className="size-24 rounded-3xl">
                {product?.mediaUrls?.[0] ? (
                  <AvatarImage
                    src={product.mediaUrls[0]}
                    alt={product.titleAr}
                    className="rounded-3xl"
                  />
                ) : null}
                <AvatarFallback className="rounded-3xl">
                  <Package className="size-8" />
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                {isProductLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-full max-w-lg" />
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-text text-3xl font-semibold">
                        {product?.titleAr ?? "المنتج"}
                      </h2>
                      <Badge variant="secondary-tonal">
                        {getProductStatusLabel(product?.status)}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {product?.titleEn || "لا يوجد عنوان إنجليزي"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline">
                        {product?.slug ? `/${product.slug}` : "بدون رابط"}
                      </Badge>
                      {optionNames.map((optionName) => (
                        <Badge key={optionName} variant="secondary">
                          {optionName}
                        </Badge>
                      ))}
                    </div>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
                      {product?.descriptionAr ||
                        "لا يوجد وصف عربي مسجل لهذا المنتج حتى الآن."}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InventoryMetaItem
                label="السعر الأساسي"
                value={formatInventoryMoney(
                  product?.basePrice,
                  product?.currencyCode
                )}
                helper="السعر الأساسي الحالي للمنتج"
              />
              <InventoryMetaItem
                label="عدد المتغيرات"
                value={String(statuses.length)}
                helper="من بيانات حالة المخزون"
              />
              <InventoryMetaItem
                label="إجمالي الرصيد"
                value={formatInventoryQuantity(totalStockQty)}
                helper="مجموع كميات جميع المتغيرات"
              />
              <InventoryMetaItem
                label="المتغير المحدد"
                value={selectedVariant?.sku || "غير محدد"}
                helper={
                  selectedVariant
                    ? selectedVariantHealth.description
                    : "اختر متغيراً لعرض حالته وحركاته"
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InventoryStatCard
          title="إجمالي الوحدات"
          value={formatInventoryQuantity(totalStockQty)}
          description="المجموع الحالي لكل أرصدة المتغيرات."
          accentClassName="bg-secondary"
        />
        <InventoryStatCard
          title="المتغيرات"
          value={String(statuses.length)}
          description="عدد المتغيرات التي ظهر لها سجل مخزون."
          accentClassName="bg-primary"
        />
        <InventoryStatCard
          title="مخزون منخفض"
          value={String(lowStockVariantsCount)}
          description="متغيرات تحتاج متابعة قريبة أو إعادة تزويد."
          accentClassName="bg-destructive/70"
        />
        <InventoryStatCard
          title="يسمح بالبيع"
          value={String(oversellVariantsCount)}
          description="متغيرات يمكن بيعها حتى عند وصول الرصيد إلى صفر."
          accentClassName="bg-[oklch(0.72_0.12_190)]"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-8">
          <Card className="gap-5 py-6">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-secondary/10 p-2 text-secondary">
                  <Boxes className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl">المتغيرات</CardTitle>
                  <CardDescription>
                    اختر متغيراً لعرض حركاته وتطبيق التعديل على رصيده.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {isStatusLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={`variant-skeleton-${index}`}
                      className="rounded-2xl border border-border/80 bg-background/60 p-4"
                    >
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-6 h-8 w-24" />
                    </div>
                  ))}
                </div>
              ) : statuses.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {statuses.map((variant) => (
                    <VariantStatusCard
                      key={variant.variantId}
                      variant={variant}
                      isSelected={
                        resolvedSelectedVariantId === variant.variantId
                      }
                      onSelect={() => setSelectedVariantId(variant.variantId)}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
                  لا توجد بيانات مخزون مرتبطة بهذا المنتج حتى الآن.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gap-5 py-6">
            <CardHeader className="pb-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <History className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">حركات المخزون</CardTitle>
                    <CardDescription>
                      آخر 20 حركة للمتغير المحدد حالياً.
                    </CardDescription>
                  </div>
                </div>

                {selectedVariant ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{selectedVariant.sku}</Badge>
                    <Badge variant={selectedVariantHealth.badgeVariant}>
                      {selectedVariantHealth.label}
                    </Badge>
                  </div>
                ) : null}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {!resolvedSelectedVariantId && !isStatusLoading ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
                  اختر متغيراً من الأعلى لعرض سجل الحركات.
                </div>
              ) : isMovementsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`movement-skeleton-${index}`}
                    className="rounded-2xl border border-border/80 bg-background/70 p-4"
                  >
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="mt-4 h-4 w-56" />
                    <Skeleton className="mt-6 h-16 w-full" />
                  </div>
                ))
              ) : movements.length ? (
                movements.map((movement) => (
                  <MovementCard key={movement.movementId} movement={movement} />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
                  لا توجد حركات مخزون لهذا المتغير حتى الآن.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:col-span-4">
          <Card className="gap-5 py-6">
            <CardHeader className="pb-0">
              <CardTitle className="text-xl">تعديل المخزون</CardTitle>
              <CardDescription>
                أضف قيمة موجبة لزيادة الرصيد أو سالبة لخفضه. يتم الحفظ كحركة
                يدوية.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      المتغير المستهدف
                    </p>
                    <p className="text-text mt-1 text-lg font-semibold">
                      {selectedVariant?.sku || "اختر متغيراً أولاً"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {selectedVariantHealth.description}
                    </p>
                  </div>

                  {selectedVariant ? (
                    <Badge variant={selectedVariantHealth.badgeVariant}>
                      {selectedVariantHealth.label}
                    </Badge>
                  ) : null}
                </div>

                {selectedVariant ? (
                  <div className="mt-4 rounded-xl bg-muted/40 px-4 py-3">
                    <p className="text-xs text-muted-foreground">
                      الرصيد الحالي
                    </p>
                    <p className="text-text mt-1 text-2xl font-semibold">
                      {formatInventoryQuantity(selectedVariant.stockQty)}
                    </p>
                  </div>
                ) : null}
              </div>

              <form
                className="flex flex-col gap-4"
                onSubmit={form.handleSubmit(handleAdjustmentSubmit)}
              >
                <Field
                  name="quantityDelta"
                  control={form.control}
                  label="قيمة التعديل"
                  placeholder="مثال: 25 أو -10"
                  inputProps={{
                    type: "number",
                    step: 1,
                    disabled: isAdjustingInventory || !selectedVariant,
                  }}
                />

                <FieldDescription>
                  مثال: `50` لإضافة خمسين وحدة، أو `-5` لسحب خمس وحدات من
                  الرصيد.
                </FieldDescription>

                <div className="flex flex-wrap gap-2">
                  {quickAdjustmentValues.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isAdjustingInventory || !selectedVariant}
                      onClick={() =>
                        form.setValue("quantityDelta", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      {formatInventoryQuantity(value, { signed: true })}
                    </Button>
                  ))}
                </div>

                <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
                  <p className="text-text text-sm font-medium">سبب الحركة</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary-tonal">MANUAL_ADJUSTMENT</Badge>
                    <span className="text-sm text-muted-foreground">
                      سيتم تسجيلها كتعديل يدوي في السجل.
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  size="md"
                  loading={isAdjustingInventory}
                  disabled={!selectedVariant}
                >
                  تطبيق التعديل
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-0 bg-[#122640] py-6 text-white">
            <CardHeader className="pb-0">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-2 text-white">
                  <Info className="size-5" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">
                    كيف يعمل التعديل؟
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    بطاقة مساعدة سريعة لفهم أثر أي حركة قبل تنفيذها.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">
                  القيم الموجبة ترفع الرصيد
                </p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  استخدمها عند استلام دفعة جديدة أو تصحيح نقص سابق.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">
                  القيم السالبة تخفض الرصيد
                </p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  استخدمها عند التلف، الجرد، أو تصحيح زيادة غير صحيحة.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-white">
                  كل تعديل يولد حركة جديدة
                </p>
                <p className="mt-1 text-sm leading-6 text-white/70">
                  يمكنك مباشرة رؤية التغير والقيمة النهائية ضمن قسم الحركات
                  للمتغير نفسه.
                </p>
              </div>
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={() => router.back()}>
            رجوع
          </Button>
        </div>
      </div>
    </div>
  )
}
