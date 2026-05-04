import z from "zod"

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
  "FAILED",
])

export const paymentStatusSchema = z.enum([
  "UNPAID",
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
])

export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerName: z.string(),
  totalAmount: z.number(),
  itemCount: z.number().optional(),
  status: orderStatusSchema,
  paymentStatus: paymentStatusSchema.optional(),
  placedAt: z.string().optional(),
  createdAt: z.string(),
})
