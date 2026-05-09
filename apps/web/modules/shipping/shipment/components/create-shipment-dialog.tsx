"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Truck } from "lucide-react"
import { toast } from "sonner"

import MapPinPicker from "@/components/system/map-pin-picker"
import PageDialog from "@/components/system/page-dialog"
import type { PaymentMethod } from "@/lib/domain-enums"
import { DAMASCUS_CENTER } from "@/lib/leaflet"
import { formatSyp } from "@/lib/money"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import { listShippingProviders } from "@/modules/shipping/provider/actions"
import { shippingProviderQueryKeys } from "@/modules/shipping/provider/queryKeys"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { createShipment } from "../actions"
import { shipmentQueryKeys } from "../queryKeys"

interface CreateShipmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  orderNumber?: string | null
  paymentMethod?: PaymentMethod | null
  orderTotal?: number | null
  destinationLat?: number | null
  destinationLng?: number | null
}

export default function CreateShipmentDialog({
  open,
  onOpenChange,
  orderId,
  orderNumber,
  paymentMethod,
  orderTotal,
  destinationLat,
  destinationLng,
}: CreateShipmentDialogProps) {
  const queryClient = useQueryClient()
  const [providerId, setProviderId] = useState("")
  const [originLat, setOriginLat] = useState(String(DAMASCUS_CENTER.lat))
  const [originLng, setOriginLng] = useState(String(DAMASCUS_CENTER.lng))
  const [destLat, setDestLat] = useState<number | null>(null)
  const [destLng, setDestLng] = useState<number | null>(null)

  const { data: providers = [] } = useQuery({
    queryKey: shippingProviderQueryKeys.all,
    queryFn: listShippingProviders,
    enabled: open,
  })

  const activeProviders = useMemo(
    () =>
      [...providers]
        .filter((p) => p.isActive !== false)
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0)),
    [providers]
  )

  useEffect(() => {
    if (!open) return

    // Default to highest-priority active provider
    if (!providerId && activeProviders.length > 0) {
      setProviderId(activeProviders[0]?.id ?? "")
    }

    setDestLat(typeof destinationLat === "number" ? destinationLat : null)
    setDestLng(typeof destinationLng === "number" ? destinationLng : null)
  }, [open, activeProviders, destinationLat, destinationLng, providerId])

  const isCod = paymentMethod === "COD"
  const expectedCodAmount =
    isCod && typeof orderTotal === "number" ? orderTotal : null

  const { mutate, isPending } = useMutation({
    mutationFn: createShipment,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.detail(orderId),
        }),
        queryClient.invalidateQueries({ queryKey: shipmentQueryKeys.all }),
      ])
      toast.success("تم إنشاء الشحنة بنجاح")
      onOpenChange(false)
    },
    onError: (error: { errorCode?: string; message?: string }) => {
      if (error?.errorCode === "ERR_8003") {
        // Existing shipment — soft success: refresh and close.
        toast.info("توجد شحنة لهذا الطلب مسبقاً")
        queryClient.invalidateQueries({
          queryKey: orderQueryKeys.detail(orderId),
        })
        onOpenChange(false)
      }
    },
  })

  const handleSubmit = () => {
    if (!providerId || destLat === null || destLng === null) return

    mutate({
      orderId,
      shippingProviderId: providerId,
      originLat: Number(originLat),
      originLng: Number(originLng),
      destinationLat: destLat,
      destinationLng: destLng,
      expectedCodAmountSyp: expectedCodAmount,
    })
  }

  const isValid =
    providerId &&
    Number.isFinite(Number(originLat)) &&
    Number.isFinite(Number(originLng)) &&
    destLat !== null &&
    destLng !== null

  return (
    <PageDialog
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="إنشاء شحنة"
      description={`الطلب: ${orderNumber ?? orderId}`}
      actions={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!isValid || isPending}
            onClick={handleSubmit}
          >
            <Truck data-icon="inline-end" />
            {isPending ? "جاري الإنشاء..." : "إنشاء الشحنة"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        {expectedCodAmount !== null ? (
          <Alert className="rounded-2xl border-amber-200 bg-amber-50 px-5 py-4">
            <AlertTitle className="text-amber-900">
              دفع عند الاستلام
            </AlertTitle>
            <AlertDescription className="text-amber-800">
              المبلغ المتوقع تحصيله من العميل:{" "}
              <span className="font-semibold">
                {formatSyp(expectedCodAmount)}
              </span>
            </AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel>مزود الشحن</FieldLabel>
          <FieldContent>
            <Select
              value={providerId}
              onValueChange={setProviderId}
              disabled={isPending || activeProviders.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المزود" />
              </SelectTrigger>
              <SelectContent>
                {activeProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id ?? ""}>
                    {provider.providerName}{" "}
                    {provider.priority !== undefined
                      ? `(أولوية ${provider.priority})`
                      : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldContent>
          <FieldDescription>
            تم الاقتراح حسب الأولوية. يمكنك تغيير المزود يدوياً.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>عنوان التسليم</FieldLabel>
          <FieldContent>
            <MapPinPicker
              latitude={destLat}
              longitude={destLng}
              defaultLatitude={
                typeof destinationLat === "number"
                  ? destinationLat
                  : DAMASCUS_CENTER.lat
              }
              defaultLongitude={
                typeof destinationLng === "number"
                  ? destinationLng
                  : DAMASCUS_CENTER.lng
              }
              onChange={({ latitude, longitude }) => {
                setDestLat(latitude)
                setDestLng(longitude)
              }}
              height={280}
            />
            {destLat !== null && destLng !== null ? (
              <div className="mt-2 flex items-center justify-between gap-4 rounded-xl bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
                <span dir="ltr">{destLat.toFixed(6)}</span>
                <span>·</span>
                <span dir="ltr">{destLng.toFixed(6)}</span>
              </div>
            ) : null}
          </FieldContent>
          <FieldDescription>
            تم الالتقاط من عنوان الطلب. يمكنك تعديله بسحب الـ pin أو النقر على
            الخريطة.
          </FieldDescription>
        </Field>

        <details className="group rounded-2xl border bg-muted/20 px-4 py-3">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground group-open:mb-3">
            إحداثيات المتجر (إعدادات متقدمة)
          </summary>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="origin-lat">خط عرض المتجر</FieldLabel>
              <FieldContent>
                <Input
                  id="origin-lat"
                  type="number"
                  step="0.000001"
                  value={originLat}
                  onChange={(e) => setOriginLat(e.target.value)}
                  disabled={isPending}
                  dir="ltr"
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="origin-lng">خط طول المتجر</FieldLabel>
              <FieldContent>
                <Input
                  id="origin-lng"
                  type="number"
                  step="0.000001"
                  value={originLng}
                  onChange={(e) => setOriginLng(e.target.value)}
                  disabled={isPending}
                  dir="ltr"
                />
              </FieldContent>
            </Field>
          </div>
        </details>
      </div>
    </PageDialog>
  )
}
