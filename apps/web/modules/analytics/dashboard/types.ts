import type { OrderStatus, PaymentStatus } from "@/lib/domain-enums"

export type DashboardPeriod = "DAY" | "WEEK" | "MONTH" | "YEAR"

export type DashboardRevenueBucket = {
  bucketStart: string
  revenue: number
}

export type DashboardLowStockAlert = {
  variantId?: string
  productTitle?: string
  sku?: string
  quantityAvailable?: number
  reorderThreshold?: number
  [key: string]: unknown
}

export type DashboardTopProduct = {
  variantId: string
  productTitle: string
  sku: string
  quantitySold: number
  revenue: number
}

export type DashboardOrderStatusCount = {
  status: OrderStatus
  count: number
}

export type DashboardCustomerGrowth = {
  newCustomersThisWeek: number
  newCustomersLastWeek: number
  growthPercent: number
}

export type DashboardRecentOrder = {
  orderId: string
  orderNumber: string
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  totalSyp: number
  placedAt: string
}

export type DashboardAnalytics = {
  period: DashboardPeriod
  orderCount: number
  revenueTotal: number
  revenueSeries: DashboardRevenueBucket[]
  previousRevenueSeries: DashboardRevenueBucket[]
  lowStockAlerts: DashboardLowStockAlert[]
  topProducts: DashboardTopProduct[]
  orderStatusBreakdown: DashboardOrderStatusCount[]
  customerGrowth: DashboardCustomerGrowth
  recentOrders: DashboardRecentOrder[]
}
