import type { ComponentDataOptionalId } from "@/core/types";
import { buildCheckoutSectionProps } from "../blocks/Section/section-preset-kinds";
import {
  createContentLink,
  createHeading,
  createInput,
  createParagraph,
  createPrimaryButton,
  createSection,
} from "./shared";

/**
 * The `/checkout` page — the step between `/cart` and a placed order.
 *
 * The order the customer walks through:
 *   address select → payment select → optional discount → totals → تأكيد الطلب
 *
 * Layout note: the signed-in half is a **single** section carrying
 * `buildCheckoutSectionProps()`, with one Group per step inside it. That is not
 * cosmetic — `CheckoutBoundShell` publishes the `checkout.*` scope *inside* the
 * section, so a `dataCondition` on the section itself would be evaluated
 * before the scope exists and would never match. Keeping every
 * `checkout.*` gate on the Groups puts it inside the scope, and means the
 * placed/unplaced swap leaves no empty padded section behind.
 */

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

/** Row that only appears when `path` is truthy (discount line, error text…). */
function createConditionalRow(
  path: string,
  content: ComponentDataOptionalId[]
) {
  return {
    type: "RowGroup" as const,
    props: {
      direction: "row",
      gap: 16,
      alignItems: "center",
      justifyContent: "space-between",
      wrap: "wrap",
      dataCondition: { path, op: "truthy" },
      content,
    },
  };
}

function createCheckoutGroup(
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

/** A money row bound to `checkout.<field>`, formatted in the store currency. */
function createMoneyRow(label: string, field: string) {
  return createRowGroup([
    createParagraph(label),
    createParagraph("", {
      valueContext: {
        path: `checkout.${field}`,
        format: "money",
        currencyPath: "checkout.currencyCode",
      },
    }),
  ]);
}

export function createCheckoutPageContent(): ComponentDataOptionalId[] {
  return [
    createSection({
      id: "Section-checkout-signedout",
      name: "تسجيل الدخول",
      showCondition: "loggedOut",
      maxWidth: "640px",
      paddingTop: "48px",
      paddingBottom: "24px",
      content: [
        createCheckoutGroup([
          createHeading("سجّل دخولك لإتمام الطلب.", { textAlign: "center" }),
          createParagraph(
            "نحتاج رقم هاتفك وعنوان التوصيل قبل تأكيد الطلب.",
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
      id: "Section-checkout",
      name: "إتمام الطلب",
      showCondition: "loggedIn",
      maxWidth: "760px",
      paddingTop: "32px",
      paddingBottom: "48px",
      ...buildCheckoutSectionProps(),
      content: [
        // ── Success — replaces every step below once the order lands ────────
        createCheckoutGroup(
          [
            createHeading("تم استلام طلبك", { textAlign: "center" }),
            createParagraph(
              "سنتواصل معك لتأكيد موعد التوصيل. يمكنك متابعة الطلب من صفحة طلباتي.",
              { textAlign: "center" }
            ),
            createContentLink("عرض طلباتي", {
              kind: "page",
              pageId: "/orders",
            }),
          ],
          {
            id: "Group-checkout-success",
            dataCondition: { path: "checkout.isPlaced", op: "truthy" },
          }
        ),

        // ── Delivery address ──────────────────────────────────────────────
        createCheckoutGroup(
          [
            createHeading("عنوان التوصيل"),
            {
              type: "ContentSelect" as const,
              props: {
                label: "اختر عنوان التوصيل",
                name: "checkout-address",
                selectAction: "checkout_address",
                enumMapKey: "",
              },
            },
            createParagraph("", {
              valueContext: { path: "checkout.addressSummary" },
              dataCondition: { path: "checkout.hasAddress", op: "truthy" },
            }),
            // Shown only when the customer has no saved address at all — the
            // select above hides itself when its option list is empty.
            createParagraph(
              "لا يوجد عنوان محفوظ. أضف عنوانك من صفحة الحساب أولاً.",
              { dataCondition: { path: "checkout.hasAddress", op: "falsy" } }
            ),
            createContentLink("إدارة العناوين", {
              kind: "page",
              pageId: "/settings",
            }),
          ],
          {
            id: "Group-checkout-address",
            dataCondition: { path: "checkout.isPlaced", op: "falsy" },
          }
        ),

        // ── Payment method ────────────────────────────────────────────────
        createCheckoutGroup(
          [
            createHeading("طريقة الدفع"),
            {
              type: "ContentSelect" as const,
              props: {
                label: "اختر طريقة الدفع",
                name: "checkout-payment-method",
                selectAction: "checkout_payment_method",
                enumMapKey: "",
              },
            },
            createParagraph("", {
              valueContext: { path: "checkout.paymentMethodName" },
              dataCondition: {
                path: "checkout.hasPaymentMethod",
                op: "truthy",
              },
            }),
          ],
          {
            id: "Group-checkout-payment",
            dataCondition: { path: "checkout.isPlaced", op: "falsy" },
          }
        ),

        // ── Discount code ─────────────────────────────────────────────────
        createCheckoutGroup(
          [
            createHeading("كود الخصم"),
            createInput("أدخل كود الخصم", "discountCode", {
              inputAction: "discount_code",
              placeholder: "مثال: 10OFF",
            }),
            createPrimaryButton("تطبيق", {
              destinationType: "action",
              buttonAction: "validateDiscount",
              buttonVariant: "secondary",
            }),
            createParagraph("", {
              valueContext: { path: "checkout.discountCode" },
              dataCondition: { path: "checkout.hasDiscount", op: "truthy" },
            }),
            createParagraph("", {
              valueContext: { path: "errors.discount" },
              dataCondition: { path: "errors.discount", op: "truthy" },
            }),
          ],
          {
            id: "Group-checkout-discount",
            dataCondition: { path: "checkout.isPlaced", op: "falsy" },
          }
        ),

        // ── Totals + place order ──────────────────────────────────────────
        createCheckoutGroup(
          [
            createHeading("ملخّص الطلب"),
            createMoneyRow("المجموع الفرعي", "subtotal"),
            createMoneyRow("تكلفة الشحن", "shippingCost"),
            createConditionalRow("checkout.hasDiscount", [
              createParagraph("الخصم"),
              createParagraph("", {
                valueContext: {
                  path: "checkout.discountAmount",
                  format: "money",
                  currencyPath: "checkout.currencyCode",
                },
              }),
            ]),
            createMoneyRow("الإجمالي", "payableTotal"),
            createPrimaryButton("تأكيد الطلب", {
              destinationType: "action",
              buttonAction: "placeOrder",
              dataCondition: { path: "checkout.canPlaceOrder", op: "truthy" },
            }),
            createParagraph(
              "اختر عنوان التوصيل وطريقة الدفع لتتمكن من تأكيد الطلب.",
              { dataCondition: { path: "checkout.canPlaceOrder", op: "falsy" } }
            ),
            createParagraph("", {
              valueContext: { path: "errors.placeOrder" },
              dataCondition: { path: "errors.placeOrder", op: "truthy" },
            }),
            createContentLink("← العودة إلى السلة", {
              kind: "page",
              pageId: "/cart",
            }),
          ],
          {
            id: "Group-checkout-summary",
            dataCondition: { path: "checkout.isPlaced", op: "falsy" },
          }
        ),
      ],
    }),
  ];
}
