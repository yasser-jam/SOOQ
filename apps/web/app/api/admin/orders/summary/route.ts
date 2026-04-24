import { NextResponse } from "next/server"

import { getMockAdminOrdersSummary } from "@/modules/order/order/apis/mock-service"

export async function GET() {
	return NextResponse.json({
		data: getMockAdminOrdersSummary(),
	})
}
