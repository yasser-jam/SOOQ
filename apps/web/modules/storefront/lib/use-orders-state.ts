"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CustomerOrderDetail,
  OrderDetailState,
  OrdersActions,
  OrdersState,
  ReturnDraftState,
} from "@/core/config/store-context";
import {
  cancelCustomerOrder,
  customerOrderKeys,
  downloadOrderInvoice,
  isOrderCancellable,
  listCustomerOrders,
  ORDERS_PAGE_SIZE,
  type CustomerOrderListItem,
} from "@/modules/storefront/lib/customer-orders-api";
import {
  createCustomerReturn,
  isOrderReturnable,
  type ReturnItemCondition,
} from "@/modules/storefront/lib/customer-returns-api";
import { getOrdersErrorMessage } from "@/modules/storefront/components/orders/orders-error";

function mapListItem(item: CustomerOrderListItem) {
  return {
    orderId: item.orderId,
    orderNumber: item.orderNumber,
    orderStatus: item.orderStatus,
    paymentStatus: item.paymentStatus,
    paymentMethod: item.paymentMethod,
    subtotal: item.subtotal,
    discountAmount: item.discountAmount,
    taxAmount: item.taxAmount,
    total: item.total,
    itemCount: item.itemCount,
    placedAt: item.placedAt,
    currencyCode: "SYP",
  };
}

function mapOrderDetail(order: CustomerOrderDetail | null): OrderDetailState {
  if (!order) {
    return {
      order: null,
      isCancellable: false,
      isReturnable: false,
      cancelReason: "",
    };
  }

  return {
    order,
    isCancellable: isOrderCancellable(order.orderStatus),
    isReturnable: isOrderReturnable(order.orderStatus),
    cancelReason: "",
  };
}

export function useOrdersState(authLoggedIn: boolean) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [orderDetail, setOrderDetailState] = useState<OrderDetailState>(
    mapOrderDetail(null)
  );
  const [returnDraft, setReturnDraft] = useState<ReturnDraftState>({
    orderId: null,
    reason: "DEFECTIVE",
    items: {},
    submitted: false,
  });

  const listQuery = useQuery({
    queryKey: customerOrderKeys.list(page, ORDERS_PAGE_SIZE),
    queryFn: () => listCustomerOrders({ page, size: ORDERS_PAGE_SIZE }),
    enabled: authLoggedIn,
  });

  useEffect(() => {
    if (!authLoggedIn) {
      setPage(0);
      setOrderDetailState(mapOrderDetail(null));
      setReturnDraft({
        orderId: null,
        reason: "DEFECTIVE",
        items: {},
        submitted: false,
      });
    }
  }, [authLoggedIn]);

  const orders = useMemo<OrdersState>(() => {
    const data = listQuery.data;
    const pageIndex = data?.pageIndex ?? page;
    const totalPages = data?.totalPages ?? 0;

    return {
      items: (data?.items ?? []).map(mapListItem),
      page: pageIndex,
      pageSize: ORDERS_PAGE_SIZE,
      totalPages,
      hasNext: data?.hasNext ?? false,
      hasPrev: data?.hasPrev ?? false,
      pageLabel:
        totalPages > 0
          ? `صفحة ${pageIndex + 1} من ${totalPages}`
          : "",
      isLoading: listQuery.isPending,
      isError: listQuery.isError,
    };
  }, [listQuery.data, listQuery.isError, listQuery.isPending, page]);

  const refreshOrders = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: customerOrderKeys.all });
  }, [queryClient]);

  const setOrderDetail = useCallback((order: CustomerOrderDetail | null) => {
    setOrderDetailState((prev) => ({
      ...mapOrderDetail(order),
      cancelReason: prev.cancelReason,
    }));
    setReturnDraft({
      orderId: order?.orderId ?? null,
      reason: "DEFECTIVE",
      items: {},
      submitted: false,
    });
  }, []);

  const actions = useMemo<OrdersActions>(
    () => ({
      nextPage: () => {
        if (orders.hasNext) setPage((prev) => prev + 1);
      },
      prevPage: () => {
        if (orders.hasPrev) setPage((prev) => Math.max(0, prev - 1));
      },
      setCancelReason: (reason: string) => {
        setOrderDetailState((prev) => ({ ...prev, cancelReason: reason }));
      },
      toggleReturnItem: (orderItemId: string, maxQuantity: number) => {
        setReturnDraft((prev) => {
          const nextItems = { ...prev.items };
          if (nextItems[orderItemId]) {
            delete nextItems[orderItemId];
          } else {
            nextItems[orderItemId] = {
              quantity: Math.max(1, maxQuantity),
              condition: "OPENED",
            };
          }
          return { ...prev, items: nextItems, submitted: false };
        });
      },
      setReturnItemQuantity: (orderItemId: string, quantity: number) => {
        setReturnDraft((prev) => {
          const current = prev.items[orderItemId];
          if (!current) return prev;
          return {
            ...prev,
            items: {
              ...prev.items,
              [orderItemId]: { ...current, quantity },
            },
          };
        });
      },
      setReturnItemCondition: (orderItemId: string, condition: string) => {
        setReturnDraft((prev) => {
          const current = prev.items[orderItemId];
          if (!current) return prev;
          return {
            ...prev,
            items: {
              ...prev.items,
              [orderItemId]: {
                ...current,
                condition,
              },
            },
          };
        });
      },
      setOrderDetail,
      refreshOrders,
      downloadInvoice: async () => {
        const order = orderDetail.order;
        if (!order?.orderId) return;
        await downloadOrderInvoice(order.orderId, order.orderNumber);
      },
      cancelOrder: async () => {
        const order = orderDetail.order;
        if (!order?.orderId) return;
        await cancelCustomerOrder(order.orderId, orderDetail.cancelReason);
        await refreshOrders();
        await queryClient.invalidateQueries({
          queryKey: customerOrderKeys.detail(order.orderId),
        });
      },
      submitReturn: async () => {
        const order = orderDetail.order;
        if (!order?.orderId) return;

        const selected = Object.entries(returnDraft.items);
        if (selected.length === 0) return;

        await createCustomerReturn({
          orderId: order.orderId,
          reason: returnDraft.reason,
          items: selected.map(([orderItemId, item]) => ({
            orderItemId,
            quantity: item.quantity,
            itemCondition: item.condition as ReturnItemCondition,
          })),
        });

        setReturnDraft((prev) => ({
          ...prev,
          items: {},
          submitted: true,
        }));
        await queryClient.invalidateQueries({
          queryKey: customerOrderKeys.detail(order.orderId),
        });
      },
    }),
    [
      orderDetail.cancelReason,
      orderDetail.order,
      orders.hasNext,
      orders.hasPrev,
      queryClient,
      refreshOrders,
      returnDraft.items,
      returnDraft.reason,
      setOrderDetail,
    ]
  );

  return {
    orders,
    orderDetail,
    returnDraft,
    actions,
    refreshOrders,
    getOrdersErrorMessage,
  };
}
