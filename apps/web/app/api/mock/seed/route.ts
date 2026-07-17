import { NextResponse } from "next/server"

import { isMockApiEnabled } from "@/lib/mock/enabled"

/**
 * Mock seeder control plane.
 *
 * GET  /api/mock/seed  → status (enabled + storage key)
 * POST /api/mock/seed  → instructs the client to wipe `sooq-mock-api-db`
 *                        (seed lives in the browser; this route only gates
 *                        and documents the contract).
 *
 * Actual reseed happens client-side via `resetMockDb()` from `@/lib/mock`
 * because the mock DB is localStorage-backed.
 */
export async function GET() {
  if (!isMockApiEnabled()) {
    return NextResponse.json(
      { success: false, message: "Mock API is disabled" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      enabled: true,
      storageKey: "sooq-mock-api-db",
      surfaces: ["auth", "store-settings", "products"],
      demoOtp: { phone: "+963999000111", otpCode: "123456" },
    },
  })
}

export async function POST() {
  if (!isMockApiEnabled()) {
    return NextResponse.json(
      { success: false, message: "Mock API is disabled" },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      action: "reset-client-db",
      storageKey: "sooq-mock-api-db",
      hint: "Call resetMockDb() from @/lib/mock in the browser, or clear the storage key.",
    },
  })
}
