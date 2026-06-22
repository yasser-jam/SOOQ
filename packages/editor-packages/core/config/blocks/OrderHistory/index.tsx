/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig } from "@/core/types";
import { getClassNameFactory } from "@/core/lib";
import { withLayout, WithLayout } from "../../components/Layout";
import { sampleOrders, type Order, type OrderStatus } from "../../data/orders";
import { formatPrice } from "../../lib/format";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("OrderHistory", styles);

// SRS DSN-005g — Order History (Bound block).
// Renders the authenticated customer's recent orders. Block is data-source-bound,
// so store_config.json carries only display config (limit, currency, status filter),
// never order rows.

export type OrderHistoryProps = WithLayout<{
  limit: number;
  currency: string;
  statusFilter: "all" | OrderStatus;
  showThumbnails: boolean;
  emptyStateText: string;
}>;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

function formatDate(iso: string, locale: string = "en") {
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function OrderHistoryRender({
  limit,
  currency,
  statusFilter,
  showThumbnails,
  emptyStateText,
}: OrderHistoryProps) {
  // In production the consuming web/mobile renderer fetches the customer's
  // orders. For the editor preview we use sample data so merchants can see
  // exactly what their customers will.
  const orders: Order[] = sampleOrders
    .filter((o) => statusFilter === "all" || o.status === statusFilter)
    .slice(0, Math.max(1, limit));

  if (orders.length === 0) {
    return (
      <div className={getClassName()}>
        <div className={getClassName("empty")}>{emptyStateText}</div>
      </div>
    );
  }

  return (
    <div className={getClassName()}>
      <ul className={getClassName("list")}>
        {orders.map((o) => (
          <li key={o.id} className={getClassName("item")}>
            {showThumbnails &&
              (o.thumbnail ? (
                <img
                  src={o.thumbnail}
                  alt=""
                  className={getClassName("thumb")}
                />
              ) : (
                <div className={getClassName("thumbPlaceholder")}>📦</div>
              ))}
            {!showThumbnails && <div />}

            <div className={getClassName("meta")}>
              <span className={getClassName("orderNumber")}>
                #{o.orderNumber}
              </span>
              <span className={getClassName("date")}>{formatDate(o.date)}</span>
              <span className={getClassName("itemCount")}>
                {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
              </span>
            </div>

            <div className={getClassName("trailing")}>
              <span className={getClassName("total")}>
                {formatPrice(o.total, currency)}
              </span>
              <span
                className={`${getClassName("status")} ${getClassName(
                  `status--${o.status}` as never
                )}`}
              >
                {STATUS_LABELS[o.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const OrderHistoryInner: ComponentConfig<OrderHistoryProps> = {
  label: "Order History",

  fields: {
    limit: {
      type: "number",
      label: "الحد الأقصى للطلبات",
      min: 1,
      max: 50,
    },
    currency: {
      type: "select",
      label: "العملة",
      options: [
        { label: "Syrian Pound (SYP)", value: "SYP" },
        { label: "US Dollar (USD)", value: "USD" },
        { label: "Euro (EUR)", value: "EUR" },
      ],
    },
    statusFilter: {
      type: "select",
      label: "تصفية حسب الحالة",
      options: [
        { label: "All", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Returned", value: "returned" },
      ],
    },
    showThumbnails: {
      type: "radio",
      label: "الصور المصغرة",
      options: [
        { label: "Show", value: true },
        { label: "Hide", value: false },
      ],
    },
    emptyStateText: {
      type: "text",
      label: "رسالة الحالة الفارغة",
    },
  },

  defaultProps: {
    limit: 5,
    currency: "SYP",
    statusFilter: "all",
    showThumbnails: true,
    emptyStateText: "You have no orders yet.",
  },

  render: OrderHistoryRender,
};

export const OrderHistory = withLayout(OrderHistoryInner);
