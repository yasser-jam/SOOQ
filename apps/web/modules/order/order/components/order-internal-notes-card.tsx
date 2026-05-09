"use client"

import * as React from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Save } from "lucide-react"
import { toast } from "sonner"

import { updateAdminOrderNotes } from "@/modules/order/order/actions"
import { initOrderNotes } from "@/modules/order/order/init"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import type { AdminOrder } from "@/modules/order/order/types"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Field as UiField,
  FieldLabel,
} from "@workspace/ui/components/field"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { Textarea } from "@workspace/ui/components/textarea"

interface OrderInternalNotesCardProps {
  orderId: string
  order?: AdminOrder
  isLoading?: boolean
}

// Doc spec (FRONTEND_PAGES_ORD_PAY_SHP.md §A3):
//   "Notes section: Two textareas — 'Internal Notes (staff only)' and
//    'Customer Notes (visible to customer)'. Send only the changed field;
//    null = no change, "" = clear."
//
// The backend exposes `notesInternal` and `notesCustomer` as plain strings on
// OrderDetailResponseDto — not a list of timestamped notes. Keep the UI flat
// and aligned with the contract.
export default function OrderInternalNotesCard({
  orderId,
  order,
  isLoading = false,
}: OrderInternalNotesCardProps) {
  const queryClient = useQueryClient()

  const originalInternal = order?.notesInternal ?? ""
  const originalCustomer = order?.notesCustomer ?? ""

  const [drafts, setDrafts] = React.useState({
    notesInternal: originalInternal,
    notesCustomer: originalCustomer,
  })

  // Keep drafts in sync with the latest order data (after a refetch / save).
  React.useEffect(() => {
    setDrafts({
      notesInternal: originalInternal,
      notesCustomer: originalCustomer,
    })
  }, [originalInternal, originalCustomer])

  const { mutate: saveNotes, isPending } = useMutation({
    mutationFn: updateAdminOrderNotes,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: orderQueryKeys.detail(orderId),
      })
      toast.success("تم حفظ الملاحظات")
    },
  })

  const internalChanged = drafts.notesInternal !== originalInternal
  const customerChanged = drafts.notesCustomer !== originalCustomer
  const hasChanges = internalChanged || customerChanged

  const handleSave = () => {
    if (!hasChanges) return
    // null = no change, string = exact replacement (incl. "" to clear).
    saveNotes(
      initOrderNotes(orderId, {
        notesInternal: internalChanged ? drafts.notesInternal : null,
        notesCustomer: customerChanged ? drafts.notesCustomer : null,
      })
    )
  }

  const updateDraft = (
    field: "notesInternal" | "notesCustomer",
    value: string
  ) => {
    setDrafts((current) => ({ ...current, [field]: value }))
  }

  return (
    <Card className="h-full gap-6 py-6">
      <CardHeader className="pb-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl">الملاحظات</CardTitle>

          <Button
            type="button"
            size="md"
            variant="secondary"
            onClick={handleSave}
            disabled={isLoading || isPending || !hasChanges}
          >
            حفظ التغييرات
            <Save data-icon="inline-end" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <UiField>
          <FieldLabel htmlFor="notesInternal">
            ملاحظات داخلية (للموظفين فقط)
          </FieldLabel>
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-md" />
          ) : (
            <Textarea
              id="notesInternal"
              name="notesInternal"
              value={drafts.notesInternal}
              onChange={(event) =>
                updateDraft("notesInternal", event.target.value)
              }
              disabled={isPending}
              placeholder="مثلاً: تم التنسيق مع المندوب — يفضّل التسليم بعد 5 مساءً."
              rows={4}
              className="min-h-24"
            />
          )}
        </UiField>

        <UiField>
          <FieldLabel htmlFor="notesCustomer">
            ملاحظات مرئية للعميل
          </FieldLabel>
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-md" />
          ) : (
            <Textarea
              id="notesCustomer"
              name="notesCustomer"
              value={drafts.notesCustomer}
              onChange={(event) =>
                updateDraft("notesCustomer", event.target.value)
              }
              disabled={isPending}
              placeholder="مثلاً: طلبك في الطريق وسيصل خلال 24 ساعة."
              rows={4}
              className="min-h-24"
            />
          )}
        </UiField>
      </CardContent>
    </Card>
  )
}
