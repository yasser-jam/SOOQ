import { NextRequest, NextResponse } from "next/server"

import {
  createMockShippingProvider,
  listMockShippingProviders,
} from "@/modules/shipping/apis/mock-service"

export async function GET() {
  return NextResponse.json({
    data: listMockShippingProviders(),
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    providerCode?: string
    providerName?: string
    apiBaseUrl?: string
    priority?: number
  }

  if (!body.providerCode || !body.providerName) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 })
  }

  return NextResponse.json({
    data: createMockShippingProvider({
      providerCode: body.providerCode,
      providerName: body.providerName,
      apiBaseUrl: body.apiBaseUrl,
      priority: body.priority,
    }),
  })
}
