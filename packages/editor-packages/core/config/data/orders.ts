export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type Order = {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  thumbnail?: string;
};

export const sampleOrders: Order[] = [
  {
    id: "ord-1001",
    orderNumber: "SOOQ-1001",
    date: "2026-04-12",
    status: "delivered",
    total: 285000,
    itemCount: 3,
    thumbnail:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "ord-1002",
    orderNumber: "SOOQ-1002",
    date: "2026-04-15",
    status: "shipped",
    total: 142500,
    itemCount: 1,
    thumbnail:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "ord-1003",
    orderNumber: "SOOQ-1003",
    date: "2026-04-17",
    status: "confirmed",
    total: 78000,
    itemCount: 2,
    thumbnail:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: "ord-1004",
    orderNumber: "SOOQ-1004",
    date: "2026-04-18",
    status: "pending",
    total: 53000,
    itemCount: 4,
  },
];
