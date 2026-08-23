export const siteConfig = {
  name: "لوحة تحكم المنصة",
  description: "إدارة متاجر SOOQ — لوحة مدير المنصة",
  supportUrl: "mailto:support@sooq.sy",
  baseUrl: process.env.NEXT_PUBLIC_PLATFORM_ADMIN_URL ?? "http://localhost:3002",
} as const
