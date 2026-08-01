import type { Metadata } from "next"
import { cookies } from "next/headers"
import "@/core/styles.css"
import "leaflet/dist/leaflet.css"
import "./globals.css"
import { Providers } from "@/components/providers"
import { SOOQ_LANG_COOKIE } from "@/core/config/locale/LanguageProvider"

export const metadata: Metadata = {
	title: "المتجر",
	description: "Storefront renderer",
}

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	const cookieStore = await cookies()
	const lang = cookieStore.get(SOOQ_LANG_COOKIE)?.value === "en" ? "en" : "ar"
	const dir = lang === "ar" ? "rtl" : "ltr"

	return (
		<html lang={lang} dir={dir}>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
