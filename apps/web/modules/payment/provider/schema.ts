import * as z from "zod"

import { requiredString } from "@/lib/schema"

/**
 * Per-provider credentials (frontend-defined shape, serialized as
 * `credentialsJson` on the wire). Each provider only consumes the keys
 * relevant to it — the backend just stores the blob.
 */
export const paymentCredentialsSchema = z.object({
	terminalId: z.string().default(""),
	username: z.string().default(""),
	password: z.string().default(""),
})

/** Per-provider non-sensitive settings (serialized as `settingsJson`). */
export const paymentSettingsSchema = z.object({
	environment: z.enum(["test", "prod"]).default("test"),
	lang: z.enum(["ar", "en"]).default("ar"),
	merchantDisplayName: z.string().default(""),
	settlementCurrency: z.string().default("SYP"),
	savedCards: z.boolean().default(false),
})

export const paymentProviderFormSchema = z.object({
	providerCode: requiredString("رمز المزود"),
	displayName: z.string().default(""),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().min(0).default(0),
	credentials: paymentCredentialsSchema,
	settings: paymentSettingsSchema,
})
