"use client"

import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import Field from "@/components/system/Field"
import MapPinPicker from "@/components/system/map-pin-picker"
import PageDialog from "@/components/system/page-dialog"
import TextareaField from "@/components/system/textarea"
import { useStorePath } from "@/lib/store-path"
import { editAdminOrder, getAdminOrder } from "@/modules/order/order/actions"
import { initOrderEdit } from "@/modules/order/order/init"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import { editOrderSchema } from "@/modules/order/order/schema"
import type {
  EditOrderFormParsed,
  EditOrderFormValues,
} from "@/modules/order/order/types"
import { getOrderShippingAddress } from "@/modules/order/order/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Field as UiField,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field"

interface OrderEditPageViewProps {
  orderId: string
}

const defaultFormValues: EditOrderFormValues = {
  items: [],
  shippingAddress: {
    // lat/lng start undefined — user must pick on the map. The schema's
    // z.number() will fail with "حدد موقع التسليم على الخريطة" until set.
    latitude: undefined as unknown as number,
    longitude: undefined as unknown as number,
    recipientName: "",
    phone: "",
    addressLabel: "",
  },
}

export default function OrderEditPageView({
  orderId,
}: OrderEditPageViewProps) {
  const router = useRouter()
  const storePath = useStorePath()
  const queryClient = useQueryClient()

  const { data: order } = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => getAdminOrder(orderId),
  })

  const form = useForm<EditOrderFormValues>({
    resolver: zodResolver(editOrderSchema) as never,
    defaultValues: defaultFormValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  useEffect(() => {
    if (!order) return

    const shippingAddress = getOrderShippingAddress(order)

    form.reset({
      items:
        order.items?.map((item) => ({
          variantId: item.variantId ?? "",
          quantity: item.quantity ?? 1,
        })) ?? [],
      shippingAddress: {
        latitude: shippingAddress?.latitude as number,
        longitude: shippingAddress?.longitude as number,
        recipientName:
          shippingAddress?.recipientName ?? shippingAddress?.name ?? "",
        phone: shippingAddress?.phone ?? "",
        addressLabel:
          shippingAddress?.addressLabel ?? shippingAddress?.details ?? "",
      },
    })
  }, [order, form])

  const { mutate, isPending } = useMutation({
    mutationFn: editAdminOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
      router.push(storePath(`/orders/${orderId}`))
    },
  })

  const onSubmit = (values: EditOrderFormParsed) => {
    mutate(
      initOrderEdit(orderId, {
        items: values.items,
        shippingAddress: {
          latitude: values.shippingAddress.latitude,
          longitude: values.shippingAddress.longitude,
          recipientName: values.shippingAddress.recipientName,
          phone: values.shippingAddress.phone,
          addressLabel: values.shippingAddress.addressLabel || undefined,
        },
      })
    )
  }

  const itemsError = form.formState.errors.items
  const itemsRootMessage =
    typeof itemsError === "object" && itemsError && "message" in itemsError
      ? (itemsError as { message?: string }).message
      : undefined

  return (
    <PageDialog
      open
      onOpenChange={(open) => {
        if (!open) router.back()
      }}
      size="lg"
      title="تعديل الطلب"
      description={`الطلب: ${order?.orderNumber ?? order?.orderId ?? orderId}`}
      actions={
        <>
          <Button variant="outline" onClick={() => router.back()}>
            إلغاء
          </Button>

          <Button
            type="submit"
            form="order-edit-form"
            variant="secondary"
            disabled={isPending}
          >
            حفظ التعديلات
          </Button>
        </>
      }
    >
      <form
        id="order-edit-form"
        className="grid gap-6"
        onSubmit={form.handleSubmit(onSubmit as never)}
      >
        <section className="grid gap-4 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              عناصر الطلب
            </h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ variantId: "", quantity: 1 })}
              disabled={isPending}
            >
              إضافة عنصر
              <Plus data-icon="inline-end" />
            </Button>
          </div>

          {itemsRootMessage ? (
            <p className="text-sm text-destructive">{itemsRootMessage}</p>
          ) : null}

          <div className="grid gap-3">
            {fields.map((fieldRow, index) => (
              <div
                key={fieldRow.id}
                className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_140px_48px]"
              >
                <Field
                  name={`items.${index}.variantId`}
                  control={form.control}
                  label="معرّف المتغيّر"
                  placeholder="variantId"
                  inputProps={{ disabled: isPending }}
                />

                <Field
                  name={`items.${index}.quantity`}
                  control={form.control}
                  label="الكمية"
                  inputProps={{
                    type: "number",
                    min: 1,
                    disabled: isPending,
                  }}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="self-end"
                  onClick={() => remove(index)}
                  disabled={isPending || fields.length === 1}
                  aria-label="حذف العنصر"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-card p-4">
          <h3 className="text-lg font-semibold text-foreground">عنوان الشحن</h3>

          <div className="grid gap-3 md:grid-cols-2">
            <Field
              name="shippingAddress.recipientName"
              control={form.control}
              label="اسم المستلم"
              placeholder="مثال: أحمد علي"
              inputProps={{ disabled: isPending }}
            />

            <Field
              name="shippingAddress.phone"
              control={form.control}
              label="رقم الهاتف"
              placeholder="+963999999999"
              inputProps={{ disabled: isPending, dir: "ltr", type: "tel" }}
            />
          </div>

          <TextareaField
            name="shippingAddress.addressLabel"
            control={form.control}
            label="ملاحظات على العنوان (اختياري)"
            placeholder="يُعرض على الفاتورة فقط"
            textareaProps={{ disabled: isPending, rows: 2 }}
          />

          <ShippingMapPickerField
            control={form.control}
            disabled={isPending}
          />
        </section>
      </form>
    </PageDialog>
  )
}

interface ShippingMapPickerFieldProps {
  control: ReturnType<typeof useForm<EditOrderFormValues>>["control"]
  disabled?: boolean
}

function ShippingMapPickerField({
  control,
  disabled,
}: ShippingMapPickerFieldProps) {
  // useWatch keeps the longitude in sync without re-renders cascading from the
  // parent form; the latitude Controller owns the field state + error display.
  const longitude = useWatch({ control, name: "shippingAddress.longitude" })

  return (
    <Controller
      control={control}
      name="shippingAddress.latitude"
      render={({ field, fieldState }) => (
        <UiField data-invalid={fieldState.invalid}>
          <FieldLabel>موقع التسليم على الخريطة</FieldLabel>
          <Controller
            control={control}
            name="shippingAddress.longitude"
            render={({ field: lngField }) => (
              <MapPinPicker
                latitude={typeof field.value === "number" ? field.value : null}
                longitude={typeof longitude === "number" ? longitude : null}
                onChange={({ latitude, longitude: lng }) => {
                  field.onChange(latitude)
                  lngField.onChange(lng)
                }}
                height={320}
                className={disabled ? "pointer-events-none opacity-60" : ""}
              />
            )}
          />
          {typeof field.value === "number" && typeof longitude === "number" ? (
            <div className="mt-2 flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
              <span dir="ltr">{field.value.toFixed(6)}</span>
              <span>·</span>
              <span dir="ltr">{longitude.toFixed(6)}</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              انقر على الخريطة أو اسحب الـ pin لتحديد عنوان التسليم
            </p>
          )}
          <FieldError errors={[fieldState.error]} />
        </UiField>
      )}
    />
  )
}
