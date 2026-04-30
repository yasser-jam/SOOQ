import { NextRequest, NextResponse } from "next/server"

import {
  deleteMockShippingProvider,
  getMockShippingProvider,
  updateMockShippingProvider,
} from "@/modules/shipping/apis/mock-service"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const provider = getMockShippingProvider(id)

  if (!provider) {
    return NextResponse.json({ message: "Provider not found" }, { status: 404 })
  }

  return NextResponse.json({ data: provider })
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  const updated = updateMockShippingProvider(id, body)
  if (!updated) {
    return NextResponse.json({ message: "Provider not found" }, { status: 404 })
  }

  return NextResponse.json({ data: updated })
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const ok = deleteMockShippingProvider(id)
  if (!ok) {
    return NextResponse.json({ message: "Provider not found" }, { status: 404 })
  }

  return NextResponse.json({ data: true })
}
