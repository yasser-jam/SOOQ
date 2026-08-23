"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { LaptopIcon, ShieldOffIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import ConfirmAlert from "@/components/system/ConfirmAlert"
import DataTable from "@/components/system/DataTable"
import { useCurrentUser } from "@/modules/auth/hooks/useCurrentUser"
import { useLogout } from "@/modules/auth/hooks/useLogout"

import {
  getRevokeSessionMutationOptions,
  listSessionsQueryOptions,
} from "../actions"
import { isCurrentSession, sortSessionsByRecency } from "../init"
import type { AuthSession } from "../types"

const formatDateTime = (value: string): string => {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

export function SessionsTable() {
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  const currentJti = user?.jti ?? null
  const { logout, isPending: isLoggingOut } = useLogout()
  const [pendingSession, setPendingSession] = React.useState<AuthSession | null>(null)

  const { data, isLoading, isError } = useQuery(listSessionsQueryOptions())

  const { isPending: isRevoking, mutate: revoke } = useMutation({
    ...getRevokeSessionMutationOptions({
      queryClient,
      onSuccess: () => toast.success("تم إنهاء الجلسة"),
    }),
  })

  const sessions = React.useMemo(() => sortSessionsByRecency(data ?? []), [data])

  const columns = React.useMemo(
    () => [
      {
        accessorKey: "jwtJti",
        header: "الجلسة",
        cell: ({ row }: { row: { original: AuthSession } }) => {
          const session = row.original
          const isMine = isCurrentSession(session, currentJti)
          return (
            <div className="flex items-center gap-3">
              <LaptopIcon className="size-4 text-muted-foreground" />
              <div className="flex flex-col">
                <span className="font-mono text-xs text-muted-foreground">
                  {session.jwtJti.slice(0, 8)}…
                </span>
                {isMine ? (
                  <Badge variant="secondary" className="w-fit">
                    هذه الجلسة الحالية
                  </Badge>
                ) : null}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: "createdAt",
        header: "بدأت في",
        cell: ({ row }: { row: { original: AuthSession } }) =>
          formatDateTime(row.original.createdAt),
      },
      {
        accessorKey: "expiresAt",
        header: "تنتهي في",
        cell: ({ row }: { row: { original: AuthSession } }) =>
          formatDateTime(row.original.expiresAt),
      },
      {
        accessorKey: "revoked",
        header: "الحالة",
        cell: ({ row }: { row: { original: AuthSession } }) =>
          row.original.revoked ? (
            <Badge variant="destructive">منتهية</Badge>
          ) : (
            <Badge variant="secondary">نشطة</Badge>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }: { row: { original: AuthSession } }) => {
          const session = row.original
          if (session.revoked) return null
          return (
            <Button
              variant="outline"
              size="sm"
              disabled={isRevoking || isLoggingOut}
              onClick={() => setPendingSession(session)}
            >
              <ShieldOffIcon className="size-4" />
              {isCurrentSession(session, currentJti) ? "تسجيل الخروج" : "إنهاء الجلسة"}
            </Button>
          )
        },
      },
    ],
    [currentJti, isRevoking, isLoggingOut]
  )

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-center text-sm text-destructive">
        تعذّر تحميل قائمة الجلسات.
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        لا توجد جلسات نشطة.
      </div>
    )
  }

  return (
    <>
      <DataTable data={sessions} columns={columns} />
      <ConfirmAlert
        open={pendingSession !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSession(null)
        }}
        title={
          pendingSession && isCurrentSession(pendingSession, currentJti)
            ? "تسجيل الخروج"
            : "إنهاء الجلسة"
        }
        description={
          pendingSession && isCurrentSession(pendingSession, currentJti)
            ? "سيتم تسجيل خروجك من هذا الجهاز."
            : "سيتم تسجيل خروج الجهاز فوراً. هل تريد المتابعة؟"
        }
        actionLabel="تأكيد"
        variant="destructive"
        onAction={() => {
          if (!pendingSession) return
          if (isCurrentSession(pendingSession, currentJti)) {
            void logout()
          } else {
            revoke(pendingSession.jwtJti)
          }
          setPendingSession(null)
        }}
      />
    </>
  )
}
