import type { CodSettlementStatus } from "./types"

/** Settlement transitions the merchant may trigger. `SETTLED` is terminal. */
export const COD_SETTLEMENT_STATUS_TRANSITIONS: Record<
  CodSettlementStatus,
  CodSettlementStatus[]
> = {
  PENDING: ["SETTLED", "DISPUTED"],
  DISPUTED: ["SETTLED"],
  SETTLED: [],
}
