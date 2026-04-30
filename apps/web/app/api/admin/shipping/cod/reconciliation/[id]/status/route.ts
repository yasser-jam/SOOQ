import { NextRequest, NextResponse } from "next/server"

import { updateMockCodReconciliationStatus } from "@/modules/shipping/apis/mock-service"
import type { CodSettlementStatus } from "@/modules/shipping/cod/types"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as { status?: CodSettlementStatus }

  if (!body.status) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  const ok = updateMockCodReconciliationStatus(id, body.status)
  if (!ok) {
    return NextResponse.json({ message: "Batch not found" }, { status: 404 })
  }

  return NextResponse.json({ data: true })
}
