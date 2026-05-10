"use client"

import { useEffect, useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"

import DataTable from "@/components/system/table"
import TableActions from "@/components/system/table-actions"
import { useStorePath } from "@/lib/store-path"
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"

import {
	deletePaymentProvider,
	listPaymentProviders,
} from "../actions"
import {
	PAYMENT_PROVIDER_CATALOG,
	isKnownProviderCode,
} from "../model"
import { paymentProviderQueryKeys } from "../queryKeys"
import type { PaymentProviderConfig } from "../types"

export default function PaymentProvidersTable() {
	const router = useRouter()
	const storePath = useStorePath()
	const queryClient = useQueryClient()

	const { data: providers, isPending } = useQuery({
		queryKey: paymentProviderQueryKeys.all,
		queryFn: listPaymentProviders,
	})

	const { mutate: removeProvider } = useMutation({
		mutationFn: deletePaymentProvider,
		onSuccess: (_data, id) => {
			queryClient.invalidateQueries({
				queryKey: paymentProviderQueryKeys.all,
			})
			queryClient.removeQueries({
				queryKey: paymentProviderQueryKeys.detail(id),
			})
		},
	})

	const columns: ColumnDef<PaymentProviderConfig>[] = [
		{
			accessorKey: "providerCode",
			header: "المزود",
			cell: ({ row }) => {
				const code = row.original.providerCode
				const catalog = isKnownProviderCode(code)
					? PAYMENT_PROVIDER_CATALOG[code]
					: undefined
				const Icon = catalog?.icon ?? CreditCard

				return (
					<div className="flex items-center gap-3">
						<Avatar>
							<AvatarFallback>
								<Icon className="size-4" />
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-0.5">
							<span className="font-medium text-foreground">
								{row.original.displayName ||
									catalog?.nameAr ||
									code}
							</span>
							<span className="font-mono text-xs text-muted-foreground">
								{code}
							</span>
						</div>
					</div>
				)
			},
		},
		{
			accessorKey: "capabilities",
			header: "الإمكانيات",
			cell: ({ row }) => {
				const tags: string[] = []
				if (row.original.requiresRedirect) tags.push("توجيه")
				if (row.original.supportsWebhook) tags.push("webhook")
				if (row.original.supportsRefund) tags.push("استرداد")
				if (row.original.supportsSavedCards) tags.push("بطاقات محفوظة")

				if (!tags.length) {
					return <span className="text-muted-foreground">—</span>
				}

				return (
					<div className="flex flex-wrap gap-1">
						{tags.map((tag) => (
							<Badge key={tag} variant="outline" className="text-xs">
								{tag}
							</Badge>
						))}
					</div>
				)
			},
		},
		{
			accessorKey: "sortOrder",
			header: "ترتيب العرض",
			cell: ({ row }) => (
				<span className="text-muted-foreground">{row.original.sortOrder}</span>
			),
		},
		{
			accessorKey: "isActive",
			header: "الحالة",
			cell: ({ row }) =>
				row.original.isActive ? (
					<Badge variant="secondary-tonal">نشط</Badge>
				) : (
					<Badge variant="outline">غير نشط</Badge>
				),
		},
		{
			id: "actions",
			enableSorting: false,
			header: () => <div></div>,
			cell: ({ row }) => {
				const id = row.original.id

				return (
					<TableActions
						onUpdate={() => {
							if (!id) return
							router.push(storePath(`/payment-providers/${id}`))
						}}
						onDelete={() => {
							if (!id) return
							removeProvider(id)
						}}
					/>
				)
			},
		},
	]

	const pageSize = 10
	const [pageIndex, setPageIndex] = useState(0)
	const totalCount = providers?.length ?? 0
	const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))

	useEffect(() => {
		setPageIndex((current) => Math.min(current, pageCount - 1))
	}, [pageCount])

	return (
		<div className="w-full overflow-hidden rounded-lg border bg-white">
			<DataTable
				columns={columns}
				isLoading={isPending}
				data={providers ?? []}
				pagination={{ pageIndex, pageSize, pageCount }}
				onPageChange={setPageIndex}
			/>
		</div>
	)
}
