import { NextResponse } from "next/server"

import { getMockShipment } from "@/modules/shipping/apis/mock-service"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const shipment = getMockShipment(id)

  if (!shipment) {
    return NextResponse.json({ message: "Shipment not found" }, { status: 404 })
  }

  return NextResponse.json({
    data: shipment,
  })
}
