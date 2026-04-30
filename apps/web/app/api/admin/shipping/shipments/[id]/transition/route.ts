import { NextRequest, NextResponse } from "next/server"

import { transitionMockShipment } from "@/modules/shipping/apis/mock-service"
import type { ShipmentStatus } from "@/modules/shipping/shipment/types"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as {
    targetStatus?: ShipmentStatus
  }

  if (!body.targetStatus) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  const result = transitionMockShipment(id, body.targetStatus)
  if (!result.ok) {
    return NextResponse.json(
      {
        success: false,
        status: result.status,
        errorCode: result.errorCode,
        message: result.message,
      },
      { status: result.status }
    )
  }

  return NextResponse.json({ data: true })
}
