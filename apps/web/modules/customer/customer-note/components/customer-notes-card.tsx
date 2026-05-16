"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Lock, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useCurrentUser } from "@/modules/auth/auth/hooks/useCurrentUser"
import { customerQueryKeys } from "@/modules/customer/customer/queryKeys"
import {
  formatDateArabic,
  formatRelativeArabic,
} from "@/modules/customer/customer/utils"
import {
  createCustomerNote,
  deleteCustomerNote,
  listCustomerNotes,
  updateCustomerNote,
} from "@/modules/customer/customer-note/actions"
import CustomerNoteDialog, {
  type CustomerNoteFormValues,
} from "@/modules/customer/customer-note/components/customer-note-dialog"
import { customerNoteQueryKeys } from "@/modules/customer/customer-note/queryKeys"
import type { CustomerNote } from "@/modules/customer/customer-note/types"
import ConfirmAlert from "@/components/system/confirm-alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

interface CustomerNotesCardProps {
  customerId: string
  initialNotes?: CustomerNote[]
}

export default function CustomerNotesCard({
  customerId,
  initialNotes,
}: CustomerNotesCardProps) {
  const queryClient = useQueryClient()
  const { hasRole } = useCurrentUser()
  const canWrite = hasRole(["OWNER", "MANAGER"])

  const [dialogState, setDialogState] = useState<
    | { mode: "create" }
    | { mode: "edit"; note: CustomerNote }
    | null
  >(null)
  const [pendingDelete, setPendingDelete] = useState<CustomerNote | null>(null)

  const { data: notes, isPending } = useQuery({
    queryKey: customerNoteQueryKeys.list(customerId),
    queryFn: () => listCustomerNotes(customerId),
    initialData: initialNotes,
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: customerNoteQueryKeys.list(customerId),
    })
    queryClient.invalidateQueries({
      queryKey: customerQueryKeys.detail(customerId),
    })
  }

  const createMutation = useMutation({
    mutationFn: createCustomerNote,
    onSuccess: () => {
      toast.success("تمت إضافة الملاحظة")
      setDialogState(null)
      invalidateAll()
    },
    onError: () => toast.error("تعذّر إضافة الملاحظة"),
  })

  const updateMutation = useMutation({
    mutationFn: updateCustomerNote,
    onSuccess: () => {
      toast.success("تم تحديث الملاحظة")
      setDialogState(null)
      invalidateAll()
    },
    onError: () => toast.error("تعذّر تحديث الملاحظة"),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerNote,
    onSuccess: () => {
      toast.success("تم حذف الملاحظة")
      setPendingDelete(null)
      invalidateAll()
    },
    onError: () => toast.error("تعذّر حذف الملاحظة"),
  })

  const handleSubmitDialog = (values: CustomerNoteFormValues) => {
    if (!dialogState) return
    if (dialogState.mode === "create") {
      createMutation.mutate({
        customerId,
        data: values,
      })
      return
    }
    updateMutation.mutate({
      customerId,
      noteId: dialogState.note.noteId,
      data: values,
    })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    deleteMutation.mutate({
      customerId,
      noteId: pendingDelete.noteId,
    })
  }

  const sortedNotes = [...(notes ?? [])].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return tb - ta
  })

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">
              ملاحظات داخلية
              {!isPending && sortedNotes.length > 0 ? (
                <span className="ms-2 text-sm font-normal text-muted-foreground">
                  ({sortedNotes.length})
                </span>
              ) : null}
            </CardTitle>

            {canWrite ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setDialogState({ mode: "create" })}
              >
                إضافة ملاحظة
                <Plus data-icon="inline-end" />
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {isPending && !notes ? (
            <>
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </>
          ) : sortedNotes.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-muted/20 py-8 text-center text-sm text-muted-foreground">
              لا توجد ملاحظات داخلية بعد. أضف ملاحظة لمساعدة فريقك على معرفة
              تفضيلات هذا العميل.
            </div>
          ) : (
            sortedNotes.map((note) => (
              <div
                key={note.noteId}
                className="flex flex-col gap-2 rounded-lg border bg-card p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDateArabic(note.createdAt)}</span>
                    <span>•</span>
                    <span>{formatRelativeArabic(note.createdAt)}</span>
                    {note.isPrivate ? (
                      <Badge variant="outline" className="gap-1">
                        <Lock className="size-3" aria-hidden />
                        خاصة
                      </Badge>
                    ) : null}
                  </div>

                  {canWrite ? (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="تحرير الملاحظة"
                        onClick={() =>
                          setDialogState({ mode: "edit", note })
                        }
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="حذف الملاحظة"
                        onClick={() => setPendingDelete(note)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ) : null}
                </div>

                <p className="whitespace-pre-wrap text-sm text-foreground">
                  {note.noteText}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <CustomerNoteDialog
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null)
        }}
        mode={dialogState?.mode ?? "create"}
        initialNote={
          dialogState?.mode === "edit" ? dialogState.note : undefined
        }
        onSubmit={handleSubmitDialog}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmAlert
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        variant="destructive"
        title="حذف الملاحظة"
        description="سيتم حذف هذه الملاحظة نهائياً ولا يمكن استرجاعها."
        actionLabel={deleteMutation.isPending ? "جاري الحذف…" : "حذف"}
        onAction={handleConfirmDelete}
        icon={<Trash2 data-icon="inline-start" />}
      />
    </>
  )
}
