import type { Metadata } from "next"
import "@/core/styles.css"
import "./globals.css"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
	title: "المتجر",
	description: "Storefront renderer",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ar" dir="rtl">
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
