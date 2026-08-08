"use client";

import React, { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  BoundDataProvider,
  type BoundDataContextValue,
} from "@/core/config/binding";
import { useActiveLanguage } from "@/core/config/locale/LanguageContext";
import {
  customerOrderKeys,
  getCustomerOrder,
  isOrderCancellable,
} from "@/modules/storefront/lib/customer-orders-api";
import { isOrderReturnable } from "@/modules/storefront/lib/customer-returns-api";
import { useStore } from "@/core/config/store-context";

export function UrlBoundOrderProvider({
  orderId,
  children,
}: {
  orderId: string;
  children: React.ReactNode;
}) {
  const { language } = useActiveLanguage();
  const { errors, actions } = useStore();

  const { data, isLoading, isError } = useQuery({
    queryKey: customerOrderKeys.detail(orderId),
    queryFn: () => getCustomerOrder(orderId),
    enabled: Boolean(orderId),
  });

  useEffect(() => {
    actions.orders.setOrderDetail(data ?? null);
  }, [data, orderId]);

  const boundData = useMemo(
    () => ({
      order: data ?? null,
      isCancellable: isOrderCancellable(data?.orderStatus),
      isReturnable: isOrderReturnable(data?.orderStatus),
      errors: {
        invoice: errors.invoice,
        cancelOrder: errors.cancelOrder,
        submitReturn: errors.submitReturn,
      },
    }),
    [data, errors.cancelOrder, errors.invoice, errors.submitReturn]
  );

  const value = useMemo<BoundDataContextValue>(
    () => ({
      data: boundData,
      isLoading,
      isError,
      metadata: null,
      language,
      selectedVariantId: null,
      setSelectedVariantId: () => {},
    }),
    [boundData, isError, isLoading, language]
  );

  return <BoundDataProvider value={value}>{children}</BoundDataProvider>;
}
