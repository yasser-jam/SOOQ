import * as z from "zod"

import { phoneSchema, requiredString } from "@/lib/schema"

import { ASSIGNABLE_PERMISSIONS } from "./permissions"

export const assignablePermissionSchema = z.enum(ASSIGNABLE_PERMISSIONS)

export const createStaffSchema = z.object({
  fullName: requiredString("الاسم الكامل"),
  phone: phoneSchema,
  permissions: z.array(assignablePermissionSchema).optional(),
})

export const updateStaffPermissionsSchema = z.object({
  permissions: z.array(assignablePermissionSchema),
})
