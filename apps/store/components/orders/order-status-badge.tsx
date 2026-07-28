import {
	ORDER_STATUS_META,
	PAYMENT_STATUS_META,
	type OrderStatus,
	type PaymentStatus,
	type StatusMeta,
} from "@/lib/domain-enums"

function StatusBadge({ meta }: { meta: StatusMeta }) {
	return (
		<span className={`OrdersBadge OrdersBadge--${meta.badgeVariant}`}>
			{meta.label}
		</span>
	)
}

const UNKNOWN_STATUS: StatusMeta = { label: "غير معروف", badgeVariant: "secondary" }

export function OrderStatusBadge({ status }: { status?: OrderStatus | null }) {
	const meta = (status && ORDER_STATUS_META[status]) || UNKNOWN_STATUS
	return <StatusBadge meta={meta} />
}

export function PaymentStatusBadge({ status }: { status?: PaymentStatus | null }) {
	const meta = (status && PAYMENT_STATUS_META[status]) || UNKNOWN_STATUS
	return <StatusBadge meta={meta} />
}
