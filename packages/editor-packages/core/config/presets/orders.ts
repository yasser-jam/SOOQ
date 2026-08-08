import type { ComponentDataOptionalId } from "@/core/types";
import {
  buildCustomerOrderDetailSectionProps,
  buildCustomerOrderItemsSectionProps,
  buildCustomerOrderTimelineSectionProps,
  buildCustomerOrdersPagerSectionProps,
  buildCustomerOrdersSectionProps,
} from "../blocks/Section/section-preset-kinds";
import {
  createContentLink,
  createHeading,
  createInput,
  createParagraph,
  createPrimaryButton,
  createSection,
  createSwitch,
} from "./shared";

function createRowGroup(content: ComponentDataOptionalId[]) {
  return {
    type: "RowGroup" as const,
    props: {
      direction: "row",
      gap: 16,
      alignItems: "center",
      justifyContent: "space-between",
      wrap: "wrap",
      content,
    },
  };
}

function createOrderGroup(
  content: ComponentDataOptionalId[],
  overrides: Record<string, unknown> = {}
) {
  return {
    type: "Group" as const,
    props: {
      direction: "column",
      gap: 16,
      alignItems: "stretch",
      justifyContent: "flex-start",
      wrap: "nowrap",
      language: "ar",
      backgroundColor: "",
      backgroundImage: "",
      backgroundOverlayColor: "",
      padding: "24px",
      borderRadius: "theme-md",
      boxShadow: "none",
      product: null,
      metadata: null,
      cartLineId: null,
      content,
      ...overrides,
    },
  };
}

function createOrderCardTemplate(): ComponentDataOptionalId {
  return createOrderGroup(
    [
      createRowGroup([
        createParagraph("", {
          valueContext: { path: "order.orderNumber" },
        }),
        {
          type: "Chip" as const,
          props: {
            chipVariantMode: "theme",
            chipVariant: "neutral",
            shape: "pill",
            size: "sm",
            gap: 6,
            maxItems: 10,
            valueContext: { path: "order.orderStatus" },
            enumMap: "orderStatus",
          },
        },
        {
          type: "Chip" as const,
          props: {
            chipVariantMode: "theme",
            chipVariant: "neutral",
            shape: "pill",
            size: "sm",
            gap: 6,
            maxItems: 10,
            valueContext: { path: "order.paymentStatus" },
            enumMap: "paymentStatus",
          },
        },
      ]),
      createRowGroup([
        createParagraph("تاريخ الطلب"),
        createParagraph("", {
          valueContext: { path: "order.placedAt", format: "datetime" },
        }),
      ]),
      createRowGroup([
        createParagraph("الإجمالي"),
        createParagraph("", {
          valueContext: {
            path: "order.total",
            format: "money",
            currencyPath: "order.currencyCode",
          },
        }),
      ]),
      createContentLink("عرض التفاصيل", {
        kind: "page",
        pageId: "/orders/:order-id",
        dynamicSegment: {
          param: "order-id",
          valueContext: { path: "order.orderId" },
        },
      }),
    ],
    { id: "Group-order-card" }
  );
}

export function createOrdersPageContent(): ComponentDataOptionalId[] {
  return [
    createSection({
      id: "Section-orders-signedout",
      name: "تسجيل الدخول",
      showCondition: "loggedOut",
      maxWidth: "640px",
      paddingTop: "48px",
      paddingBottom: "24px",
      content: [
        createOrderGroup([
          createHeading("سجّل دخولك لعرض طلباتك.", { textAlign: "center" }),
          createParagraph(
            "يمكنك تسجيل الدخول برقم هاتفك لمتابعة طلباتك وإدارة حسابك.",
            { textAlign: "center" }
          ),
          createContentLink("تسجيل الدخول", {
            kind: "page",
            pageId: "/login",
          }),
        ]),
      ],
    }),
    createSection({
      id: "Section-orders-list",
      name: "قائمة الطلبات",
      showCondition: "loggedIn",
      maxWidth: "960px",
      paddingTop: "24px",
      paddingBottom: "24px",
      columns: 1,
      ...buildCustomerOrdersSectionProps(),
      content: [createOrderCardTemplate()],
      cardTemplate: [createOrderCardTemplate()],
    }),
    createSection({
      id: "Section-orders-pager",
      name: "تصفّح الطلبات",
      showCondition: "loggedIn",
      maxWidth: "960px",
      paddingTop: "0px",
      paddingBottom: "48px",
      ...buildCustomerOrdersPagerSectionProps(),
      content: [
        createRowGroup([
          createPrimaryButton("السابق", {
            destinationType: "action",
            buttonAction: "ordersPrevPage",
            buttonVariant: "secondary",
          }),
          createParagraph("", {
            valueContext: { path: "orders.pageLabel" },
          }),
          createPrimaryButton("التالي", {
            destinationType: "action",
            buttonAction: "ordersNextPage",
            buttonVariant: "secondary",
          }),
        ]),
      ],
    }),
  ];
}

function createOrderItemTemplate(): ComponentDataOptionalId {
  return createOrderGroup(
    [
      createRowGroup([
        {
          type: "ContentSwitch" as const,
          props: {
            label: "",
            name: "return-item-selected",
            helperText: "",
            defaultChecked: false,
            labelPosition: "start",
            switchAction: "return_item_selected",
            showCondition: "always",
            dataCondition: { path: "isReturnable", op: "truthy" },
          },
        },
        createParagraph("", {
          valueContext: { path: "item.productTitle" },
        }),
      ]),
      createParagraph("", {
        valueContext: { path: "item.sku" },
      }),
      createRowGroup([
        createParagraph("الكمية"),
        createParagraph("", {
          valueContext: { path: "item.quantity" },
        }),
      ]),
      createRowGroup([
        createParagraph("سعر الوحدة"),
        createParagraph("", {
          valueContext: {
            path: "item.unitPrice",
            format: "money",
            currencyPath: "order.currencyCode",
          },
        }),
      ]),
      createRowGroup([
        createParagraph("الإجمالي"),
        createParagraph("", {
          valueContext: {
            path: "item.totalPrice",
            format: "money",
            currencyPath: "order.currencyCode",
          },
        }),
      ]),
      createInput("الكمية المُرجعة", "return-qty", {
        inputType: "number",
        inputAction: "return_item_quantity",
        min: 1,
        dataCondition: { path: "isReturnable", op: "truthy" },
      }),
      {
        type: "ContentSelect" as const,
        props: {
          label: "حالة المنتج",
          name: "return-condition",
          selectAction: "return_item_condition",
          enumMapKey: "returnItemCondition",
          dataCondition: { path: "isReturnable", op: "truthy" },
        },
      },
    ],
    { id: "Group-order-item" }
  );
}

function createTimelineEntryTemplate(): ComponentDataOptionalId {
  return createOrderGroup([
    {
      type: "Chip" as const,
      props: {
        chipVariantMode: "theme",
        chipVariant: "neutral",
        shape: "pill",
        size: "sm",
        gap: 6,
        maxItems: 10,
        valueContext: { path: "timelineEntry.action" },
        enumMap: "timelineAction",
      },
    },
    createParagraph("", {
      valueContext: { path: "timelineEntry.createdAt", format: "datetime" },
    }),
    {
      type: "Chip" as const,
      props: {
        chipVariantMode: "theme",
        chipVariant: "neutral",
        shape: "pill",
        size: "sm",
        gap: 6,
        maxItems: 10,
        valueContext: { path: "timelineEntry.actor" },
        enumMap: "timelineActor",
      },
    },
    createParagraph("", {
      valueContext: { path: "timelineEntry.details" },
    }),
  ]);
}

export function createOrderDetailPageContent(): ComponentDataOptionalId[] {
  return [
    createSection({
      id: "Section-order-detail-signedout",
      name: "تسجيل الدخول",
      showCondition: "loggedOut",
      maxWidth: "640px",
      paddingTop: "48px",
      content: [
        createOrderGroup([
          createHeading("سجّل دخولك لعرض تفاصيل الطلب.", { textAlign: "center" }),
          createContentLink("تسجيل الدخول", {
            kind: "page",
            pageId: "/login",
          }),
        ]),
      ],
    }),
    createSection({
      id: "Section-order-detail-header",
      name: "تفاصيل الطلب",
      showCondition: "loggedIn",
      maxWidth: "960px",
      paddingTop: "24px",
      ...buildCustomerOrderDetailSectionProps(),
      content: [
        createContentLink("← كل الطلبات", {
          kind: "page",
          pageId: "/orders",
        }),
        createRowGroup([
          createHeading("", {
            valueContext: { path: "order.orderNumber" },
          }),
          {
            type: "Chip" as const,
            props: {
              chipVariantMode: "theme",
              chipVariant: "neutral",
              shape: "pill",
              size: "sm",
              gap: 6,
              maxItems: 10,
              valueContext: { path: "order.orderStatus" },
              enumMap: "orderStatus",
            },
          },
          {
            type: "Chip" as const,
            props: {
              chipVariantMode: "theme",
              chipVariant: "neutral",
              shape: "pill",
              size: "sm",
              gap: 6,
              maxItems: 10,
              valueContext: { path: "order.paymentStatus" },
              enumMap: "paymentStatus",
            },
          },
        ]),
        createParagraph("", {
          valueContext: { path: "order.placedAt", format: "datetime" },
        }),
        createRowGroup([
          createPrimaryButton("تحميل الفاتورة", {
            destinationType: "action",
            buttonAction: "downloadInvoice",
          }),
          createPrimaryButton("إلغاء الطلب", {
            destinationType: "zone",
            zoneKey: "cancel-order",
            zoneAction: "open",
            buttonVariant: "error",
            dataCondition: { path: "isCancellable", op: "truthy" },
          }),
        ]),
        createParagraph("", {
          valueContext: { path: "errors.invoice" },
          dataCondition: { path: "errors.invoice", op: "truthy" },
        }),
      ],
    }),
    createSection({
      id: "Section-order-items",
      name: "المنتجات",
      showCondition: "loggedIn",
      maxWidth: "960px",
      ...buildCustomerOrderItemsSectionProps(),
      content: [createOrderItemTemplate()],
      cardTemplate: [createOrderItemTemplate()],
    }),
    createSection({
      id: "Section-order-summary",
      name: "ملخّص الدفع",
      showCondition: "loggedIn",
      maxWidth: "960px",
      ...buildCustomerOrderDetailSectionProps(),
      content: [
        createHeading("ملخّص الدفع"),
        createRowGroup([
          createParagraph("المجموع الفرعي"),
          createParagraph("", {
            valueContext: {
              path: "order.subtotal",
              format: "money",
              currencyPath: "order.currencyCode",
            },
          }),
        ]),
        {
          type: "RowGroup" as const,
          props: {
            direction: "row",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            wrap: "wrap",
            dataCondition: { path: "order.discountAmount", op: "truthy" },
            content: [
              createParagraph("الخصم"),
              createParagraph("", {
                valueContext: {
                  path: "order.discountAmount",
                  format: "money",
                  currencyPath: "order.currencyCode",
                },
              }),
            ],
          },
        },
        {
          type: "RowGroup" as const,
          props: {
            direction: "row",
            gap: 16,
            alignItems: "center",
            justifyContent: "space-between",
            wrap: "wrap",
            dataCondition: { path: "order.taxAmount", op: "truthy" },
            content: [
              createParagraph("الضريبة"),
              createParagraph("", {
                valueContext: {
                  path: "order.taxAmount",
                  format: "money",
                  currencyPath: "order.currencyCode",
                },
              }),
            ],
          },
        },
        createRowGroup([
          createParagraph("تكلفة الشحن"),
          createParagraph("", {
            valueContext: {
              path: "order.shippingCost",
              format: "money",
              currencyPath: "order.currencyCode",
            },
          }),
        ]),
        createRowGroup([
          createParagraph("الإجمالي"),
          createParagraph("", {
            valueContext: {
              path: "order.total",
              format: "money",
              currencyPath: "order.currencyCode",
            },
          }),
        ]),
        {
          type: "Chip" as const,
          props: {
            chipVariantMode: "theme",
            chipVariant: "neutral",
            shape: "pill",
            size: "sm",
            gap: 6,
            maxItems: 10,
            valueContext: { path: "order.paymentMethod" },
            enumMap: "paymentMethod",
          },
        },
      ],
    }),
    createSection({
      id: "Section-order-address",
      name: "عنوان التوصيل",
      showCondition: "loggedIn",
      maxWidth: "960px",
      ...buildCustomerOrderDetailSectionProps(),
      dataCondition: { path: "order.shippingAddress", op: "truthy" },
      content: [
        createHeading("عنوان التوصيل"),
        createParagraph("", {
          valueContext: { path: "order.shippingAddress.recipientName" },
        }),
        createParagraph("", {
          valueContext: { path: "order.shippingAddress.phone" },
        }),
        createParagraph("", {
          valueContext: { path: "order.shippingAddress.addressLabel" },
        }),
      ],
    }),
    createSection({
      id: "Section-order-notes",
      name: "ملاحظاتك",
      showCondition: "loggedIn",
      maxWidth: "960px",
      ...buildCustomerOrderDetailSectionProps(),
      dataCondition: { path: "order.notesCustomer", op: "truthy" },
      content: [
        createHeading("ملاحظاتك"),
        createParagraph("", {
          valueContext: { path: "order.notesCustomer" },
        }),
      ],
    }),
    createSection({
      id: "Section-order-timeline",
      name: "سجلّ الطلب",
      showCondition: "loggedIn",
      maxWidth: "960px",
      ...buildCustomerOrderTimelineSectionProps(),
      content: [createTimelineEntryTemplate()],
      cardTemplate: [createTimelineEntryTemplate()],
    }),
    createSection({
      id: "Section-order-return-actions",
      name: "طلب إرجاع",
      showCondition: "loggedIn",
      maxWidth: "960px",
      ...buildCustomerOrderDetailSectionProps(),
      dataCondition: { path: "isReturnable", op: "truthy" },
      content: [
        createPrimaryButton("طلب إرجاع المنتجات", {
          destinationType: "action",
          buttonAction: "submitReturn",
        }),
        createParagraph("", {
          valueContext: { path: "errors.submitReturn" },
          dataCondition: { path: "errors.submitReturn", op: "truthy" },
        }),
      ],
    }),
  ];
}

export function createCancelOrderZonePopup(): ComponentDataOptionalId {
  return {
    type: "ZonePopup",
    props: {
      is_active: true,
      is_mobile_only: false,
      zoneKey: "cancel-order",
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      maxWidth: "480px",
      overlay: true,
      showCloseButton: true,
      slot: [
        createOrderGroup([
          createHeading("إلغاء الطلب"),
          createParagraph(
            "سيتم إلغاء الطلب. لا يمكن التراجع عن هذه الخطوة."
          ),
          createInput("سبب الإلغاء (اختياري)", "cancel-reason", {
            inputAction: "cancel_reason",
          }),
          createParagraph("", {
            valueContext: { path: "errors.cancelOrder" },
            dataCondition: { path: "errors.cancelOrder", op: "truthy" },
          }),
          createRowGroup([
            createPrimaryButton("تراجع", {
              destinationType: "zone",
              zoneKey: "cancel-order",
              zoneAction: "close",
              buttonVariant: "secondary",
            }),
            createPrimaryButton("تأكيد الإلغاء", {
              destinationType: "action",
              buttonAction: "cancelOrder",
              buttonVariant: "error",
            }),
          ]),
        ]),
      ],
    },
  };
}
