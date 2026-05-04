"use client"

import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import PageDialog from "@/components/system/page-dialog"
import { formatSyp } from "@/lib/money"
import { initiateRefund } from "@/modules/payment/refund/actions"
import { refundQueryKeys } from "@/modules/payment/refund/queryKeys"
import { orderQueryKeys } from "@/modules/order/order/queryKeys"
import {
	Alert,
	AlertDescription,
} from "@workspace/ui/components/alert"
import { Button } from "@workspace/ui/components/button"
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

interface InitiateRefundDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	orderId: string
	orderNumber?: string | null
	orderTotal?: number | null
	paymentMethod?: "COD" | "PAYMERA" | null
}

export default function InitiateRefundDialog({
	open,
	onOpenChange,
	orderId,
	orderNumber,
	orderTotal,
	paymentMethod,
}: InitiateRefundDialogProps) {
	const queryClient = useQueryClient()
	const [amount, setAmount] = useState<string>("")
	const [reason, setReason] = useState("")

	useEffect(() => {
		if (!open) return

		setAmount(typeof orderTotal === "number" ? String(orderTotal) : "")
		setReason("")
	}, [open, orderTotal])

	const { mutate, isPending } = useMutation({
		mutationFn: initiateRefund,
		onSuccess: async (refund) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: orderQueryKeys.detail(orderId),
				}),
				queryClient.invalidateQueries({ queryKey: orderQueryKeys.all }),
				queryClient.invalidateQueries({ queryKey: refundQueryKeys.all }),
				queryClient.invalidateQueries({
					queryKey: refundQueryKeys.byOrder(orderId),
				}),
			])

			if (paymentMethod === "COD") {
				toast.success("تم تسجيل الاسترداد كقيد دفتري")
			} else if (refund.status === "COMPLETED") {
				toast.success("تم تنفيذ الاسترداد بنجاح")
			} else if (refund.status === "FAILED") {
				toast.error("فشل تنفيذ الاسترداد عبر بوابة الدفع")
			} else {
				toast.success("تم بدء عملية الاسترداد")
			}

			onOpenChange(false)
		},
	})

	const numericAmount = Number(amount)
	const isAmountValid =
		Number.isFinite(numericAmount) &&
		numericAmount > 0 &&
		(typeof orderTotal !== "number" || numericAmount <= orderTotal)
	const exceedsTotal =
		typeof orderTotal === "number" &&
		Number.isFinite(numericAmount) &&
		numericAmount > orderTotal

	const handleSubmit = () => {
		if (!isAmountValid || !reason.trim()) return

		mutate({
			orderId,
			refundAmount: Math.round(numericAmount),
			reason: reason.trim(),
		})
	}

	const isPaymera = paymentMethod === "PAYMERA"

	return (
		<PageDialog
			open={open}
			onOpenChange={onOpenChange}
			size="sm"
			title="بدء استرداد"
			description={`الطلب: ${orderNumber ?? orderId}`}
			actions={
				<>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						إلغاء
					</Button>
					<Button
						type="button"
						variant="destructive"
						disabled={!isAmountValid || !reason.trim() || isPending}
						onClick={handleSubmit}
					>
						{isPending ? "جاري التنفيذ..." : "تأكيد الاسترداد"}
					</Button>
				</>
			}
		>
			<div className="grid gap-4">
				<Alert
					className={
						isPaymera
							? "rounded-2xl border-blue-200 bg-blue-50 px-5 py-4"
							: "rounded-2xl border-amber-200 bg-amber-50 px-5 py-4"
					}
				>
					<AlertTriangle className="my-auto me-4 size-6 text-amber-700" />
					<AlertDescription className="text-base leading-relaxed">
						{isPaymera
							? "سيتم استدعاء بوابة Paymera لاسترداد المبلغ مباشرةً. النتيجة ستظهر فوراً."
							: "الدفع عند الاستلام: الاسترداد سيُسجَّل كقيد دفتري داخلي ويتم استعادة المخزون."}
					</AlertDescription>
				</Alert>

				<Field>
					<FieldLabel htmlFor="refund-amount">
						مبلغ الاسترداد (SYP)
					</FieldLabel>
					<FieldContent>
						<Input
							id="refund-amount"
							type="number"
							min="1"
							step="1"
							value={amount}
							onChange={(event) => setAmount(event.target.value)}
							disabled={isPending}
						/>
					</FieldContent>
					{typeof orderTotal === "number" ? (
						<FieldDescription>
							الحد الأقصى: {formatSyp(orderTotal)}
						</FieldDescription>
					) : null}
					{exceedsTotal ? (
						<FieldError
							errors={[{ message: "المبلغ يتجاوز إجمالي الطلب" }]}
						/>
					) : null}
				</Field>

				<Field>
					<FieldLabel htmlFor="refund-reason">سبب الاسترداد</FieldLabel>
					<FieldContent>
						<Textarea
							id="refund-reason"
							value={reason}
							onChange={(event) => setReason(event.target.value)}
							placeholder="مثال: العميل أرجع المنتج لعدم مطابقته للوصف"
							className="min-h-32"
							disabled={isPending}
						/>
					</FieldContent>
				</Field>
			</div>
		</PageDialog>
	)
}
