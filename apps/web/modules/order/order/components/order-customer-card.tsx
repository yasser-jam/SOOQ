import {
  AtSign,
  ChevronLeft,
  ChevronRight,
  Phone,
  UserRound,
} from "lucide-react"

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
    <p className="text-text text-lg leading-tight font-semibold">
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
            {customer?.avatarUrl ? (
              <AvatarImage
                src={customer.avatarUrl}
                alt={customer.name ?? "صورة العميل"}
              />
            ) : null}
            <AvatarFallback className="bg-muted text-muted-foreground/95">
              <UserRound className="size-10" />
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-1 flex-col gap-2">
            <DataLabel value={customer?.name} fallback="اسم الوسيط" />
            <div className="text-gray-500">12/4/2004</div>
          </div>
        </div>

        <section className="flex flex-col gap-4 rounded-3xl bg-primary/20 p-5">
          <h3 className="text-text text-xl">معلومات التواصل</h3>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <Phone className="me-2 size-4 text-muted-foreground" />
              <DataValue value={"+963993544711"} />
            </div>

            <div className="flex items-center">
              <AtSign className="me-2 size-4 text-muted-foreground" />
              <DataValue value={"customer@example.com"} />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-3xl bg-secondary/20 p-5">
          <h3 className="text-text text-xl">عنوان الشحن</h3>
          <div className="flex flex-col gap-2">
            <DataValue value={"دمشق"} />
            <DataValue value={"الزاهرة القديمة"} />
            <DataValue value={"بجوار مدرسة الزاهرة القديمة - أمام الموقف"} />
          </div>
        </section>
      </CardContent>
    </Card>
  )
}
