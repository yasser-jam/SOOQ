import {
  AtSign,
  ChevronLeft,
  Phone,
  UserRound,
} from "lucide-react"

import type { AdminOrder } from "@/modules/order/order/types"
import {
  formatOrderDate,
  getOrderCustomerName,
  getOrderShippingAddress,
} from "@/modules/order/order/utils"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface OrderCustomerCardProps {
  order?: AdminOrder
  isLoading?: boolean
}

function DataValue({ value }: { value?: string }) {
  if (value) {
    return <p className="text-text-secondary text-base font-medium">{value}</p>
  }

  return <Skeleton className="h-5 w-44" />
}

function DataLabel({ value, fallback }: { value?: string; fallback: string }) {
  return (
    <p className="text-text text-lg leading-tight font-semibold">
      {value ?? fallback}
    </p>
  )
}

export default function OrderCustomerCard({
  order,
  isLoading = false,
}: OrderCustomerCardProps) {
  const customer = order?.customer
  const shippingAddress = getOrderShippingAddress(order)

  return (
    <Card className="h-full gap-6 rounded-3xl py-6">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">معلومات العميل</CardTitle>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-transparent"
          >
            <ChevronLeft />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Avatar className="border-text/70 size-22 border-[2px] bg-muted">
            {customer?.avatarUrl && !isLoading ? (
              <AvatarImage
                src={customer.avatarUrl}
                alt={getOrderCustomerName(customer)}
              />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground/95">
              <UserRound className="size-10" />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-2">
            <DataLabel value={getOrderCustomerName(customer)} fallback="اسم العميل" />
            <div className="text-gray-500">
              {isLoading ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                formatOrderDate(customer?.createdAt ?? customer?.joinedAt) || "—"
              )}
            </div>
          </div>
        </div>

        <section className="flex flex-col gap-4 rounded-3xl bg-primary/20 p-5">
          <h3 className="text-text text-xl">معلومات التواصل</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <Phone className="me-2 size-4 text-muted-foreground" />
              <DataValue value={isLoading ? undefined : customer?.phone ?? undefined} />
            </div>

            <div className="flex items-center">
              <AtSign className="me-2 size-4 text-muted-foreground" />
              <DataValue value={isLoading ? undefined : customer?.email ?? undefined} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-secondary/20 p-5">
          <h3 className="text-text text-xl">عنوان الشحن</h3>
          <div className="flex flex-col gap-2">
            <DataValue value={isLoading ? undefined : shippingAddress?.city ?? undefined} />
            <DataValue
              value={isLoading ? undefined : shippingAddress?.district ?? undefined}
            />
            <DataValue
              value={
                isLoading
                  ? undefined
                  : shippingAddress?.details ?? shippingAddress?.street ?? undefined
              }
            />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
