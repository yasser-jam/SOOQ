import Providers from "@/components/Providers"

export default function StorefrontShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}
