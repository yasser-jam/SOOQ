export type AnalyticsPeriod = "WEEK" | "MONTH" | "YEAR"

export type RevenueBucket = {
  bucketStart: string
  revenue: number
}

export type RevenueAnalytics = {
  period: AnalyticsPeriod
  granularity: string
  current: RevenueBucket[]
  previous: RevenueBucket[]
}

export type ProfitProduct = {
  variantId: string
  productTitle: string
  sku: string
  revenue: number
  estimatedCost: number
  profit: number
  marginPercent: number
}

export type ProfitAnalytics = {
  revenueTotal: number
  estimatedCostTotal: number
  grossProfit: number
  marginPercent: number
  bestMarginProducts: ProfitProduct[]
  worstMarginProducts: ProfitProduct[]
}

export type FxRateEntry = {
  currencyCode?: string
  rate?: number
  source?: string
  asOf?: string
  [key: string]: unknown
}

export type FxImpactAnalytics = {
  activeRates: FxRateEntry[]
  averageRatesFromOrders: FxRateEntry[]
  revenueInPeriod: number
  marginDeltaEstimate: number
}
