"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { SendHorizontal } from "lucide-react"

import { updateAdminOrderNotes } from "@/modules/order/order/actions"
import { initOrderNotes } from "@/modules/order/order/init"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import type { AdminOrder, AdminOrderNote } from "@/modules/order/order/types"
import {
  formatOrderDateTime,
  getOrderNotesByChannel,
} from "@/modules/order/order/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Textarea } from "@workspace/ui/components/textarea"

interface OrderInternalNotesCardProps {
  orderId: string
  order?: AdminOrder
  isLoading?: boolean
}

type NoteTone = "primary" | "secondary"

interface MockNoteCardModel {
  id: string
  title: string
  description: string
  timingLabel: string
  tone: NoteTone
}

const MOCK_NOTES_BY_CHANNEL: Record<"INTERNAL" | "CUSTOMER", MockNoteCardModel[]> = {
  INTERNAL: [
    {
      id: "mock-internal-1",
      title: "ملاحظة عمليات",
      description: "تم التنسيق مع فريق التوصيل لتجهيز الشحنة قبل نهاية اليوم.",
      timingLabel: "من ساعتين",
      tone: "primary",
    },
    {
      id: "mock-internal-2",
      title: "ملاحظة لوجستية",
      description: "تم تحديث موقع التسليم بعد التأكيد الهاتفي مع العميل.",
      timingLabel: "من 35 دقيقة",
      tone: "secondary",
    },
  ],
  CUSTOMER: [
    {
      id: "mock-customer-1",
      title: "رسالة للعميل",
      description: "طلبك قيد التحضير وسيتم إشعارك عند خروجه مع المندوب.",
      timingLabel: "من ساعة",
      tone: "primary",
    },
    {
      id: "mock-customer-2",
      title: "تحديث الحالة",
      description: "تمت مراجعة عنوان الشحن بنجاح، ولا توجد تعديلات إضافية.",
      timingLabel: "من 20 دقيقة",
      tone: "secondary",
    },
  ],
}

function MockNoteCard({ note }: { note: MockNoteCardModel }) {
  const toneClasses =
    note.tone === "primary"
      ? {
          card: "border-primary/40 bg-primary/5",
          title: "text-primary/80",
        }
      : {
          card: "border-secondary/40 bg-primary/5",
          title: "text-secondary/80",
        }

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-0 border-s-3 p-4 ${toneClasses.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className={`text-base font-semibold ${toneClasses.title}`}>
            {note.title}
          </p>
          <p className="text-sm leading-7 text-gray-500">{note.description}</p>
        </div>
        <p className="shrink-0 text-xs text-gray-400">{note.timingLabel}</p>
      </div>
    </div>
  )
}

function OrderNoteCard({ note }: { note: AdminOrderNote }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/35 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-text text-lg font-semibold">
          {note.authorRole ?? note.authorName ?? "النظام"}
        </p>
        <p className="text-sm text-muted-foreground">
          {note.timestampLabel ??
            formatOrderDateTime(note.createdAt ?? note.updatedAt) ??
            "—"}
        </p>
      </div>
      <p className="text-text-secondary text-base leading-7">
        {note.body ?? note.message}
      </p>
    </div>
  )
}

export default function OrderInternalNotesCard({
  orderId,
  order,
  isLoading = false,
}: OrderInternalNotesCardProps) {
  const queryClient = useQueryClient()
  const [activeChannel, setActiveChannel] = React.useState<
    "INTERNAL" | "CUSTOMER"
  >("INTERNAL")
  const [drafts, setDrafts] = React.useState({
    INTERNAL: "",
    CUSTOMER: "",
  })

  React.useEffect(() => {
    setDrafts({
      INTERNAL: order?.notesInternal ?? "",
      CUSTOMER: order?.notesCustomer ?? "",
    })
  }, [order?.notesCustomer, order?.notesInternal])

  const { mutate: saveNotes, isPending } = useMutation({
    mutationFn: updateAdminOrderNotes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) })
    },
  })

  const activeNotes =
    activeChannel === "INTERNAL"
      ? getOrderNotesByChannel(order?.notes, "INTERNAL")
      : getOrderNotesByChannel(order?.notes, "CUSTOMER")
  const currentText =
    activeChannel === "INTERNAL" ? drafts.INTERNAL : drafts.CUSTOMER
  const mockNotes = MOCK_NOTES_BY_CHANNEL[activeChannel]

  const handleSubmit = () => {
    const trimmedInternal = drafts.INTERNAL.trim()
    const trimmedCustomer = drafts.CUSTOMER.trim()
    const originalInternal = (order?.notesInternal ?? "").trim()
    const originalCustomer = (order?.notesCustomer ?? "").trim()

    const internalChanged =
      activeChannel === "INTERNAL" && trimmedInternal !== originalInternal
    const customerChanged =
      activeChannel === "CUSTOMER" && trimmedCustomer !== originalCustomer

    if (!internalChanged && !customerChanged) return

    saveNotes(
      initOrderNotes(orderId, {
        notesInternal: internalChanged ? trimmedInternal : null,
        notesCustomer: customerChanged ? trimmedCustomer : null,
      })
    )
  }

  return (
    <Card className="h-full gap-6 py-6">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl">ملاحظات داخلية ولوجستية</CardTitle>
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-4">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          <Button
            type="button"
            size="md"
            variant={activeChannel === "INTERNAL" ? "outline" : "ghost"}
            onClick={() => setActiveChannel("INTERNAL")}
          >
            الفريق الداخلي
          </Button>

          <Button
            type="button"
            size="md"
            variant={activeChannel === "CUSTOMER" ? "outline" : "ghost"}
            onClick={() => setActiveChannel("CUSTOMER")}
          >
            مرئي للعميل
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {!isLoading && currentText ? (
            <div className="rounded-2xl border border-border bg-background p-4 text-base leading-7 text-text-secondary">
              {currentText}
            </div>
          ) : null}

          {activeNotes.length ? (
            activeNotes.map((note) => (
              <OrderNoteCard
                key={note.id ?? note.noteId ?? note.createdAt}
                note={note}
              />
            ))
          ) : (
            <>
              {mockNotes.map((mockNote) => (
                <MockNoteCard key={mockNote.id} note={mockNote} />
              ))}
            </>
          )}
        </div>

        <div className="relative">
          <Textarea
            placeholder="اكتب ملاحظة..."
            className="min-h-24"
            value={currentText}
            onChange={(event) =>
              setDrafts((current) => ({
                ...current,
                [activeChannel]: event.target.value,
              }))
            }
            disabled={isLoading || isPending}
          />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute bottom-3 left-3 rotate-180"
            onClick={handleSubmit}
            disabled={isLoading || isPending}
          >
            <SendHorizontal />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
