import type { ComponentType } from "react"
import { CreditCard, Wallet } from "lucide-react"

import type { PaymentCredentials, PaymentSettings } from "./types"

export type PaymentProviderCode = "COD" | "PAYMERA"

export interface PaymentProviderCatalogEntry {
	code: PaymentProviderCode
	nameAr: string
	descriptionAr: string
	icon: ComponentType<{ className?: string }>
	credentialFields: (keyof PaymentCredentials)[]
	settingsFields: (keyof PaymentSettings)[]
	defaultDisplayName: string
}

/**
 * Frontend catalog of supported provider codes. The backend itself decides
 * which providers are wired up; this catalog drives the form UX (which fields
 * to show, labels, default display name).
 */
export const PAYMENT_PROVIDER_CATALOG: Record<
	PaymentProviderCode,
	PaymentProviderCatalogEntry
> = {
	COD: {
		code: "COD",
		nameAr: "الدفع عند الاستلام",
		descriptionAr:
			"يتلقى العميل المنتج ثم يدفع نقداً للمندوب. لا يحتاج بيانات اعتماد.",
		icon: Wallet,
		credentialFields: [],
		settingsFields: [],
		defaultDisplayName: "الدفع عند الاستلام",
	},
	PAYMERA: {
		code: "PAYMERA",
		nameAr: "Paymera (بطاقة Visa/MasterCard)",
		descriptionAr:
			"بوابة دفع إلكتروني. يحتاج Terminal ID واسم مستخدم وكلمة مرور من بوابة Paymera.",
		icon: CreditCard,
		credentialFields: ["terminalId", "username", "password"],
		settingsFields: [
			"environment",
			"merchantDisplayName",
			"settlementCurrency",
			"savedCards",
			"lang",
		],
		defaultDisplayName: "Paymera (بطاقة)",
	},
}

export const SETTINGS_FIELD_LABELS: Record<keyof PaymentSettings, string> = {
	environment: "البيئة",
	lang: "لغة بوابة الدفع",
	merchantDisplayName: "الاسم التجاري الظاهر",
	settlementCurrency: "عملة التسوية",
	savedCards: "السماح بحفظ البطاقات",
}

export const CREDENTIAL_FIELD_LABELS: Record<
	keyof PaymentCredentials,
	string
> = {
	terminalId: "Terminal ID",
	username: "اسم المستخدم",
	password: "كلمة المرور",
}

export const ENVIRONMENT_LABELS: Record<PaymentSettings["environment"], string> =
	{
		test: "تجريبية (Test)",
		prod: "إنتاج (Production)",
	}

export const LANG_LABELS: Record<PaymentSettings["lang"], string> = {
	ar: "العربية",
	en: "English",
}

export const isKnownProviderCode = (
	value: string
): value is PaymentProviderCode =>
	value === "COD" || value === "PAYMERA"
