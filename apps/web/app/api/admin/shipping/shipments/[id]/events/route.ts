import { NextResponse } from "next/server"

import { listMockShipmentEvents } from "@/modules/shipping/apis/mock-service"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params

  return NextResponse.json({
    data: listMockShipmentEvents(id),
  })
}
