import z from "zod"

import { requiredString } from "@/lib/schema"

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

// PUT /admin/orders/{id}/edit — items[] replaces all; shippingAddress is a
// single object with coordinates (no governorate/city/street fields).
export const editOrderItemSchema = z.object({
  variantId: requiredString("معرّف المتغيّر"),
  quantity: z.coerce
    .number()
    .int("الكمية يجب أن تكون عدداً صحيحاً")
    .min(1, "الكمية يجب أن تكون 1 على الأقل"),
})

export const editOrderShippingAddressSchema = z.object({
  latitude: z
    .number({ message: "حدد موقع التسليم على الخريطة" })
    .min(-90, "خط العرض غير صحيح")
    .max(90, "خط العرض غير صحيح"),
  longitude: z
    .number({ message: "حدد موقع التسليم على الخريطة" })
    .min(-180, "خط الطول غير صحيح")
    .max(180, "خط الطول غير صحيح"),
  recipientName: requiredString("اسم المستلم"),
  // Backend pattern is ^[0-9+]{8,15}$ — accepts foreign customer phones
  // (more permissive than the OWNER OTP +9639XXXXXXXX rule).
  phone: z
    .string()
    .trim()
    .min(1, "رقم الهاتف مطلوب")
    .regex(/^[0-9+]{8,15}$/, "رقم الهاتف يجب أن يكون 8-15 رقماً (يسمح بـ +)"),
  addressLabel: z.string().trim().optional(),
})

export const editOrderSchema = z.object({
  items: z.array(editOrderItemSchema).min(1, "أضف عنصراً واحداً على الأقل"),
  shippingAddress: editOrderShippingAddressSchema,
})
