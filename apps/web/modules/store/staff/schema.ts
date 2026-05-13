import * as z from "zod"

import { phoneSchema, requiredString } from "@/lib/schema"

// STAFF capabilities are a fixed matrix on the backend (V31 dropped
// `staff_member.permissions_json`). The frontend no longer sends or
// reads per-user permission strings — STR.md §STR-010.
export const createStaffSchema = z.object({
  fullName: requiredString("الاسم الكامل"),
  phone: phoneSchema,
})
