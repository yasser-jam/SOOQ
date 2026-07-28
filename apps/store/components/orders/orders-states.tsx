import Link from "next/link"

type OrdersMessageProps = {
	title: string
	description?: string
	action?: { href: string; label: string }
}

/** Shared loading / empty / error panel for the order pages. */
export function OrdersMessage({ title, description, action }: OrdersMessageProps) {
	return (
		<div className="OrdersMessage">
			<h2 className="OrdersMessage-title">{title}</h2>
			{description && <p className="OrdersMessage-text">{description}</p>}
			{action && (
				<Link className="OrdersButton OrdersButton--primary" href={action.href}>
					{action.label}
				</Link>
			)}
		</div>
	)
}

/**
 * There is no standalone login route in apps/store — the OTP flow lives in a
 * block on the storefront itself, so the only thing to offer is a way back.
 */
export function OrdersSignInRequired({ basePath }: { basePath: string }) {
	return (
		<OrdersMessage
			title="سجّل الدخول لعرض طلباتك"
			description="طلباتك مرتبطة بحسابك. عُد إلى المتجر وسجّل الدخول برقم هاتفك، ثم افتح هذه الصفحة مجدداً."
			action={{ href: basePath, label: "العودة إلى المتجر" }}
		/>
	)
}
