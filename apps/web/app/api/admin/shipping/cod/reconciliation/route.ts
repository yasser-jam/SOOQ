import { NextRequest, NextResponse } from "next/server"

import {
  createMockCodReconciliationBatch,
  listMockCodReconciliationBatches,
} from "@/modules/shipping/apis/mock-service"

const parseNumberParam = (value: string | null): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const page = parseNumberParam(searchParams.get("page"))
  const size = parseNumberParam(searchParams.get("size"))

  return NextResponse.json({
    data: listMockCodReconciliationBatches({ page, size }),
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    shippingProviderId?: string
    providerFeePercentage?: number
    settlementDate?: string
    notes?: string
  }

  if (!body.shippingProviderId || !body.settlementDate) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  const fee = typeof body.providerFeePercentage === "number" ? body.providerFeePercentage : 0

  return NextResponse.json({
    data: createMockCodReconciliationBatch({
      shippingProviderId: body.shippingProviderId,
      providerFeePercentage: fee,
      settlementDate: body.settlementDate,
      notes: body.notes,
    }),
  })
}
