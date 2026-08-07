import Providers from "@/components/Providers"

export default function MerchantDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <Providers>{children}</Providers>
}
