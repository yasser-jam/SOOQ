"use client"

import { useCallback, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm, useWatch } from "react-hook-form"
import { RefreshCw, Percent, DollarSign } from "lucide-react"
import { toast } from "sonner"

import DatePickerField from "@/components/system/date-picker"
import Field from "@/components/system/Field"
import PageDialog from "@/components/system/page-dialog"
import { useStorePath } from "@/lib/store-path"
import {
  createDiscountCode,
  getDiscountCode,
  updateDiscountCode,
} from "@/modules/order/discount-code/actions"
import {
  discountCodeFormDefaults,
  initDiscountCodeFormValues,
  initDiscountCodeUpdate,
} from "@/modules/order/discount-code/init"
import { DISCOUNT_TYPE_LABELS } from "@/modules/order/discount-code/model"
import { discountCodeQueryKeys } from "@/modules/order/discount-code/queryKeys"
import {
  createDiscountCodeSchema,
  discountTypeSchema,
} from "@/modules/order/discount-code/schema"
import type {
  CreateDiscountCodeFormValues,
  CreateDiscountCodePayload,
  DiscountType,
} from "@/modules/order/discount-code/types"
import { Button } from "@workspace/ui/components/button"
import { DialogClose } from "@workspace/ui/components/dialog"
import { FieldError, FieldLabel } from "@workspace/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

const DISCOUNT_TYPE_VALUES = discountTypeSchema.options

export default function EditDiscountCodePage() {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()
  const params = useParams()
  const codeId = params?.["discount-code-id"]?.toString() ?? ""
  const isEdit = codeId !== "create"

  const form = useForm<CreateDiscountCodeFormValues>({
    resolver: zodResolver(createDiscountCodeSchema) as never,
    defaultValues: discountCodeFormDefaults,
  })

  const { data: code, isLoading } = useQuery({
    queryKey: discountCodeQueryKeys.detail(codeId),
    queryFn: () => getDiscountCode(codeId),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!isEdit) {
      form.reset(discountCodeFormDefaults)
      return
    }

    if (!code) return

    form.reset(initDiscountCodeFormValues(code))
  }, [code, form, isEdit])

  const { isPending: isCreating, mutate: createMutation } = useMutation({
    mutationFn: createDiscountCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountCodeQueryKeys.all })
      toast.success("تم إنشاء كود الخصم بنجاح")
      router.push(storePath("/discount-codes"))
    },
  })

  const { isPending: isUpdating, mutate: updateMutation } = useMutation({
    mutationFn: updateDiscountCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountCodeQueryKeys.all })
      if (codeId) {
        queryClient.invalidateQueries({
          queryKey: discountCodeQueryKeys.detail(codeId),
        })
      }
      toast.success("تم حفظ التعديلات")
      router.push(storePath("/discount-codes"))
    },
  })

  const handleSubmit = useCallback(
    (values: CreateDiscountCodeFormValues) => {
      const parsed = createDiscountCodeSchema.parse({
        ...values,
        applicableScope: "ALL",
      }) as CreateDiscountCodePayload

      if (isEdit) {
        if (!codeId) return
        const { code: _omitCode, discountType: _omitType, ...rest } = parsed
        updateMutation(initDiscountCodeUpdate(codeId, rest))
        return
      }

      createMutation(parsed)
    },
    [codeId, createMutation, isEdit, updateMutation]
  )

  const isSubmitting = isCreating || isUpdating || isLoading

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let nextCode = ""
    for (let i = 0; i < 8; i++) {
      nextCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    form.setValue("code", nextCode, { shouldDirty: true, shouldValidate: true })
  }

  const discountType = useWatch({ control: form.control, name: "discountType" })
  const startsAt = useWatch({ control: form.control, name: "startsAt" })
  const startsAtDate = startsAt ? new Date(startsAt) : undefined

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="md"
      title={isEdit ? "تعديل كود الخصم" : "إضافة كود خصم"}
      description={
        isEdit
          ? "حدّث قيمة الخصم وقيود الاستخدام وتواريخ الصلاحية."
          : "أنشئ رمزاً يمنحه عملاؤك عند الدفع للحصول على خصم."
      }
      actions={
        <>
          <DialogClose asChild>
            <Button variant="outline">إلغاء</Button>
          </DialogClose>
          <Button
            type="submit"
            form="discount-code-form"
            disabled={isSubmitting}
            variant="secondary"
          >
            حفظ
          </Button>
        </>
      }
    >
      <form
        id="discount-code-form"
        className="grid gap-6"
        onSubmit={form.handleSubmit(handleSubmit)}
      >
        <section className="grid gap-4 rounded-2xl border bg-background p-4">
          <h3 className="text-base font-semibold text-foreground">
            بيانات الكود
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex items-start gap-2 md:col-span-2">
              <div className="min-w-0 flex-1">
                <Field
                  name="code"
                  control={form.control}
                  label={
                    <>
                      الرمز (كود الخصم)
                      <span className="text-destructive">*</span>
                    </>
                  }
                  placeholder="مثال: WELCOME10"
                  inputProps={{
                    disabled: isSubmitting || isEdit,
                    className: "uppercase font-mono tracking-wide",
                  }}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  الكود الذي سيستخدمه العميل للحصول على الخصم
                </p>
              </div>
              {!isEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateRandomCode}
                  disabled={isSubmitting}
                  className="mt-7 size-10 shrink-0"
                  aria-label="توليد رمز عشوائي"
                >
                  <RefreshCw />
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel className="gap-1">
                نوع الخصم
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                name="discountType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as DiscountType)
                      }
                      disabled={isSubmitting || isEdit}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue placeholder="اختر نوع الخصم" />
                      </SelectTrigger>
                      <SelectContent>
                        {DISCOUNT_TYPE_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {DISCOUNT_TYPE_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={[fieldState.error]} />
                  </>
                )}
              />
            </div>

            <div>
              <Field
                name="discountValue"
                control={form.control}
                label={
                  <>
                    قيمة الخصم
                    <span className="text-destructive">*</span>
                    {discountType === "PERCENTAGE" ? (
                      <Percent className="size-3.5 text-muted-foreground" />
                    ) : (
                      <DollarSign className="size-3.5 text-muted-foreground" />
                    )}
                  </>
                }
                inputProps={{
                  type: "number",
                  min: "0.01",
                  step: "0.01",
                  disabled: isSubmitting,
                }}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {discountType === "PERCENTAGE"
                  ? "نسبة مئوية من إجمالي الطلب"
                  : "مبلغ ثابت بالعملة المحلية"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-background p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              قيود الاستخدام
            </h3>
            <p className="text-xs text-muted-foreground">
              اترك الحقول فارغة لإلغاء القيد
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              name="minOrderAmount"
              control={form.control}
              label="الحد الأدنى للطلب"
              inputProps={{
                type: "number",
                min: "0",
                disabled: isSubmitting,
              }}
            />

            <Field
              name="maxDiscountCap"
              control={form.control}
              label="الحد الأقصى للخصم"
              inputProps={{
                type: "number",
                min: "0",
                disabled: isSubmitting,
              }}
            />

            <Field
              name="usageLimit"
              control={form.control}
              label="عدد مرات الاستخدام الكلي"
              inputProps={{
                type: "number",
                min: "1",
                disabled: isSubmitting,
              }}
            />

            <Field
              name="perCustomerMax"
              control={form.control}
              label="عدد مرات استخدام العميل"
              inputProps={{
                type: "number",
                min: "1",
                disabled: isSubmitting,
              }}
            />
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-background p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              فترة الصلاحية
            </h3>
            <p className="text-xs text-muted-foreground">
              سيتم تفعيل الكود من تاريخ البداية وحتى تاريخ الانتهاء
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 md:grid-cols-2">
            <DatePickerField
              name="startsAt"
              control={form.control}
              label="تاريخ البداية"
              placeholder="اختر تاريخ البداية والوقت"
              disabled={isSubmitting}
            />

            <DatePickerField
              name="expiresAt"
              control={form.control}
              label="تاريخ الانتهاء"
              placeholder="اختر تاريخ الانتهاء والوقت"
              disabled={isSubmitting}
              minDate={
                startsAtDate && !Number.isNaN(startsAtDate.getTime())
                  ? startsAtDate
                  : new Date()
              }
            />
          </div>
        </section>
      </form>
    </PageDialog>
  )
}
