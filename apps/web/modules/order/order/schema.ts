import z from "zod"

const orderStatusSchema = z.enum([
  "NEW",
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
])

export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  totalAmount: z.number(),
  status: orderStatusSchema,
  createdAt: z.string(),
})
