"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import PageDialog from "@/components/system/page-dialog"
import { editAdminOrder, getAdminOrder } from "@/modules/order/order/actions"
import { initOrderEdit } from "@/modules/order/order/init"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import type { AdminOrderShippingAddress, EditOrderPayload } from "@/modules/order/order/types"
import { getOrderShippingAddress } from "@/modules/order/order/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"

interface OrderEditPageViewProps {
  orderId: string
}

const emptyShippingAddress: AdminOrderShippingAddress = {
  governorate: "",
  city: "",
  district: "",
  street: "",
  phone: "",
  name: "",
}

export default function OrderEditPageView({
  orderId,
}: OrderEditPageViewProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: order } = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => getAdminOrder(orderId),
  })
  const [form, setForm] = useState<EditOrderPayload>({
    items: [],
    shippingAddress: emptyShippingAddress,
  })

  useEffect(() => {
    if (!order) return

    const shippingAddress = getOrderShippingAddress(order)

    setForm({
      items:
        order.items?.map((item) => ({
          variantId: item.variantId ?? "",
          quantity: item.quantity ?? 1,
        })) ?? [],
      shippingAddress: {
        ...emptyShippingAddress,
        ...shippingAddress,
      },
    })
  }, [order])

  const { mutate, isPending } = useMutation({
    mutationFn: editAdminOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: orderQueryKeys.all })
      router.push(`/orders/${orderId}`)
    },
  })

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
            type="button"
            variant="secondary"
            disabled={isPending || form.items.length === 0}
            onClick={() => mutate(initOrderEdit(orderId, form))}
          >
            حفظ التعديلات
          </Button>
        </>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4 rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">عناصر الطلب</h3>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  items: [...current.items, { variantId: "", quantity: 1 }],
                }))
              }
            >
              إضافة عنصر
              <Plus data-icon="inline-end" />
            </Button>
          </div>

          <div className="grid gap-3">
            {form.items.map((item, index) => (
              <div
                key={`${item.variantId}-${index}`}
                className="grid gap-3 rounded-xl border p-3 md:grid-cols-[1fr_140px_48px]"
              >
                <Input
                  value={item.variantId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      items: current.items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentItem,
                              variantId: event.target.value,
                            }
                          : currentItem
                      ),
                    }))
                  }
                  placeholder="variantId"
                  disabled={isPending}
                />

                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      items: current.items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentItem,
                              quantity: Number(event.target.value || 1),
                            }
                          : currentItem
                      ),
                    }))
                  }
                  placeholder="الكمية"
                  disabled={isPending}
                />

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      items: current.items.filter((_, currentIndex) => currentIndex !== index),
                    }))
                  }
                  disabled={isPending}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 rounded-2xl border bg-card p-4 md:grid-cols-2">
          <Input
            value={form.shippingAddress.name ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shippingAddress: {
                  ...current.shippingAddress,
                  name: event.target.value,
                },
              }))
            }
            placeholder="اسم المستلم"
            disabled={isPending}
          />

          <Input
            value={form.shippingAddress.phone ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shippingAddress: {
                  ...current.shippingAddress,
                  phone: event.target.value,
                },
              }))
            }
            placeholder="رقم الهاتف"
            disabled={isPending}
          />

          <Input
            value={form.shippingAddress.governorate ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shippingAddress: {
                  ...current.shippingAddress,
                  governorate: event.target.value,
                },
              }))
            }
            placeholder="المحافظة"
            disabled={isPending}
          />

          <Input
            value={form.shippingAddress.city ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shippingAddress: {
                  ...current.shippingAddress,
                  city: event.target.value,
                },
              }))
            }
            placeholder="المدينة"
            disabled={isPending}
          />

          <Input
            value={form.shippingAddress.district ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shippingAddress: {
                  ...current.shippingAddress,
                  district: event.target.value,
                },
              }))
            }
            placeholder="الحي"
            disabled={isPending}
          />

          <Input
            value={form.shippingAddress.street ?? ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                shippingAddress: {
                  ...current.shippingAddress,
                  street: event.target.value,
                },
              }))
            }
            placeholder="الشارع والتفاصيل"
            disabled={isPending}
          />
        </section>
      </div>
    </PageDialog>
  )
}
