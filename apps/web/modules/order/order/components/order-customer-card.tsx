import { ChevronRight, UserRound } from "lucide-react"

import type { OrderCustomerModel } from "@/modules/order/order/model"
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
  customer?: OrderCustomerModel
}

function DataValue({ value }: { value?: string }) {
  if (value) {
    return <p className="text-text-secondary text-base font-medium">{value}</p>
  }

  return <Skeleton className="h-5 w-44" />
}

function DataLabel({ value, fallback }: { value?: string; fallback: string }) {
  return (
    <p className="text-text text-2xl leading-tight font-semibold">
      {value ?? fallback}
    </p>
  )
}

export default function OrderCustomerCard({
  customer,
}: OrderCustomerCardProps) {
  return (
    <Card className="h-full gap-6 rounded-3xl py-6">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:bg-transparent"
          >
            <ChevronRight />
          </Button>
          <CardTitle className="text-2xl font-bold">معلومات العميل</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Avatar className="border-text/70 size-28 border-[3px] bg-muted">
            {customer?.avatarUrl ? (
              <AvatarImage
                src={customer.avatarUrl}
                alt={customer.name ?? "صورة العميل"}
              />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground">
              <UserRound className="size-14" />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col items-center gap-2 text-center">
            <DataLabel value={customer?.name} fallback="اسم الوسيط" />
            <DataLabel
              value={customer?.joinDateLabel}
              fallback="تاريخ الانضمام"
            />
          </div>
        </div>

        <section className="flex flex-col gap-4 rounded-3xl bg-muted/50 p-5">
          <h3 className="text-text text-2xl font-bold">معلومات التواصل</h3>
          <div className="flex flex-col items-center gap-3 text-center">
            <DataValue value={customer?.contact?.phone} />
            <DataValue value={customer?.contact?.email} />
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-muted/50 p-5">
          <h3 className="text-text text-2xl font-bold">عنوان الشحن</h3>
          <div className="flex flex-col items-center gap-3 text-center">
            <DataValue value={customer?.shippingAddress?.district} />
            <DataValue value={customer?.shippingAddress?.city} />
            <DataValue value={customer?.shippingAddress?.country} />
            <DataValue value={customer?.shippingAddress?.details} />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
