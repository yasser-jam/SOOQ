import { NextResponse } from "next/server"

import { listMockShipments } from "@/modules/shipping/apis/mock-service"

export async function GET() {
  return NextResponse.json({
    data: listMockShipments(),
  })
}
