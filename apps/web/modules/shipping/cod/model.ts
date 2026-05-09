import type { CodSettlementStatus } from "./types"

export const COD_SETTLEMENT_STATUS_META: Record<
  CodSettlementStatus,
  {
    label: string
    badgeVariant:
      | "secondary"
      | "secondary-tonal"
      | "outline"
      | "destructive"
  }
> = {
  PENDING: {
    label: "قيد التسوية",
    badgeVariant: "secondary",
  },
  SETTLED: {
    label: "تمت التسوية",
    badgeVariant: "outline",
  },
  DISPUTED: {
    label: "يوجد خلاف",
    badgeVariant: "destructive",
  },
}

export const COD_SETTLEMENT_STATUS_TRANSITIONS: Record<
  CodSettlementStatus,
  CodSettlementStatus[]
> = {
  PENDING: ["SETTLED", "DISPUTED"],
  DISPUTED: ["SETTLED"],
  SETTLED: [],
}
