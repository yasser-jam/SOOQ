import { NextResponse } from "next/server"

import { getMockAdminOrderTimeline } from "@/modules/order/order/apis/mock-service"

interface RouteContext {
	params: Promise<{
		id: string
	}>
}

export async function GET(_request: Request, context: RouteContext) {
	const { id } = await context.params
	const timeline = getMockAdminOrderTimeline(id)

	if (!timeline) {
		return NextResponse.json({ message: "Order not found" }, { status: 404 })
	}

	return NextResponse.json({
		data: timeline,
	})
}
