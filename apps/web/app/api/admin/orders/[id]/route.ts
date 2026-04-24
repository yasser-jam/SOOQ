import { NextResponse } from "next/server"

import { getMockAdminOrder } from "@/modules/order/order/apis/mock-service"

interface RouteContext {
	params: Promise<{
		id: string
	}>
}

export async function GET(_request: Request, context: RouteContext) {
	const { id } = await context.params
	const order = getMockAdminOrder(id)

	if (!order) {
		return NextResponse.json({ message: "Order not found" }, { status: 404 })
	}

	return NextResponse.json({
		data: order,
	})
}
