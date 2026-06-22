"use client";
import React, { useMemo, useState } from "react";
import { getClassNameFactory } from "@/core/lib";
import {
  mockCheckoutSession,
  getCheckoutOrderLines,
  getCheckoutSubtotal,
  getCheckoutEstimatedTax,
  getCheckoutTotal,
  CHECKOUT_DEMO_SHIPPING,
  formatMoney,
  type MockShippingAddress,
} from "../../data/checkout";
import styles from "./styles.module.css";
import type { CheckoutFormProps } from "./types";

const getClassName = getClassNameFactory("CheckoutForm", styles);

type StepId = "address" | "payment" | "summary";

const STEPS: { id: StepId; label: string }[] = [
  { id: "address", label: "Address" },
  { id: "payment", label: "Payment" },
  { id: "summary", label: "Order summary" },
];

export function CheckoutFormClient({
  showDataHints,
}: CheckoutFormProps) {
  const [step, setStep] = useState<StepId>("address");
  const [address, setAddress] = useState<MockShippingAddress>({
    ...mockCheckoutSession.shippingAddress,
  });

  const lines = useMemo(() => getCheckoutOrderLines(), []);
  const subtotal = useMemo(() => getCheckoutSubtotal(lines), [lines]);
  const tax = useMemo(() => getCheckoutEstimatedTax(subtotal), [subtotal]);
  const total = useMemo(
    () => getCheckoutTotal(subtotal, CHECKOUT_DEMO_SHIPPING, tax),
    [subtotal, tax]
  );

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const goNext = () => {
    if (step === "address") setStep("payment");
    else if (step === "payment") setStep("summary");
  };

  const goBack = () => {
    if (step === "payment") setStep("address");
    else if (step === "summary") setStep("payment");
  };

  const updateAddress = (key: keyof MockShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={getClassName()}>
      <h2 className={getClassName("title")}>Checkout</h2>
      <p className={getClassName("subtitle")}>
        Multi-step flow — demo session + cart from{" "}
        <code>config/data/checkout.ts</code> &amp;{" "}
        <code>config/data/cart.ts</code>
      </p>

      {showDataHints && (
        <p className={getClassName("sessionHint")}>
          Session: <code>{mockCheckoutSession.id}</code> ·{" "}
          Email: {mockCheckoutSession.customerEmail}
        </p>
      )}

      <div className={getClassName("steps")} role="tablist">
        {STEPS.map((s, i) => {
          const active = s.id === step;
          const done = i < stepIndex;
          return (
            <span
              key={s.id}
              className={[
                getClassName("stepTab"),
                active ? getClassName("stepTab--active") : "",
                done && !active ? getClassName("stepTab--done") : "",
              ]
                .filter(Boolean)
                .join(" ")}
              role="tab"
              aria-selected={active}
            >
              {done ? "✓ " : `${i + 1}. `}
              {s.label}
            </span>
          );
        })}
      </div>

      <div className={getClassName("panel")}>
        {step === "address" && (
          <>
            <div className={getClassName("field")}>
              <label className={getClassName("label")} htmlFor="cf-fullName">
                Full name
              </label>
              <input
                id="cf-fullName"
                className={getClassName("input")}
                value={address.fullName}
                onChange={(e) => updateAddress("fullName", e.target.value)}
              />
            </div>
            <div className={getClassName("field")}>
              <label className={getClassName("label")} htmlFor="cf-line1">
                Address line 1
              </label>
              <input
                id="cf-line1"
                className={getClassName("input")}
                value={address.line1}
                onChange={(e) => updateAddress("line1", e.target.value)}
              />
            </div>
            <div className={getClassName("field")}>
              <label className={getClassName("label")} htmlFor="cf-line2">
                Address line 2
              </label>
              <input
                id="cf-line2"
                className={getClassName("input")}
                value={address.line2}
                onChange={(e) => updateAddress("line2", e.target.value)}
              />
            </div>
            <div className={getClassName("row2")}>
              <div className={getClassName("field")}>
                <label className={getClassName("label")} htmlFor="cf-city">
                  City
                </label>
                <input
                  id="cf-city"
                  className={getClassName("input")}
                  value={address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                />
              </div>
              <div className={getClassName("field")}>
                <label className={getClassName("label")} htmlFor="cf-region">
                  State / Region
                </label>
                <input
                  id="cf-region"
                  className={getClassName("input")}
                  value={address.region}
                  onChange={(e) => updateAddress("region", e.target.value)}
                />
              </div>
            </div>
            <div className={getClassName("row2")}>
              <div className={getClassName("field")}>
                <label className={getClassName("label")} htmlFor="cf-postal">
                  Postal code
                </label>
                <input
                  id="cf-postal"
                  className={getClassName("input")}
                  value={address.postalCode}
                  onChange={(e) => updateAddress("postalCode", e.target.value)}
                />
              </div>
              <div className={getClassName("field")}>
                <label className={getClassName("label")} htmlFor="cf-country">
                  Country
                </label>
                <input
                  id="cf-country"
                  className={getClassName("input")}
                  value={address.country}
                  onChange={(e) => updateAddress("country", e.target.value)}
                />
              </div>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <p className={getClassName("subtitle")} style={{ marginBottom: "0.75rem" }}>
              Demo payment (read-only). Wire to Stripe / Payment Element in production.
            </p>
            <div className={getClassName("paymentCard")}>
              <strong>
                {mockCheckoutSession.payment.brand} ·•••{" "}
                {mockCheckoutSession.payment.last4}
              </strong>
              <div className={getClassName("line")} style={{ marginTop: "0.5rem" }}>
                <span>Expires</span>
                <span>{mockCheckoutSession.payment.expiry}</span>
              </div>
              <div className={getClassName("line")}>
                <span>Billing email</span>
                <span>{mockCheckoutSession.customerEmail}</span>
              </div>
            </div>
          </>
        )}

        {step === "summary" && (
          <>
            <div className={getClassName("line")}>
              <span>Ship to</span>
              <span style={{ textAlign: "right" }}>
                {address.fullName}
                <br />
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}, {address.region} {address.postalCode}
                <br />
                {address.country}
              </span>
            </div>
            <div style={{ marginTop: "1rem" }}>
              {lines.map(({ line, product, lineTotal }) => (
                <div key={line.lineId} className={getClassName("itemRow")}>
                  <span>
                    {product.title} × {line.quantity}
                  </span>
                  <span>{formatMoney(lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className={getClassName("line")}>
              <span>Subtotal</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <div className={getClassName("line")}>
              <span>Shipping</span>
              <span>{formatMoney(CHECKOUT_DEMO_SHIPPING)}</span>
            </div>
            <div className={getClassName("line")}>
              <span>Estimated tax</span>
              <span>{formatMoney(tax)}</span>
            </div>
            <div
              className={[getClassName("line"), getClassName("line--total")]
                .filter(Boolean)
                .join(" ")}
            >
              <span>Total</span>
              <span>{formatMoney(total)}</span>
            </div>
            <span className={getClassName("badge")}>Demo — no charge</span>
          </>
        )}
      </div>

      <div className={getClassName("nav")}>
        <button
          type="button"
          className={getClassName("btn")}
          onClick={goBack}
          disabled={step === "address"}
        >
          Back
        </button>
        {step !== "summary" ? (
          <button
            type="button"
            className={`${getClassName("btn")} ${getClassName("btnPrimary")}`}
            onClick={goNext}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className={`${getClassName("btn")} ${getClassName("btnPrimary")}`}
            onClick={() =>
              window.alert("Place order — demo only. Connect to your API.")
            }
          >
            Place order
          </button>
        )}
      </div>
    </div>
  );
}
