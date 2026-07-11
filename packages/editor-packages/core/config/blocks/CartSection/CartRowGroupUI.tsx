"use client";

import React from "react";
import { getClassNameFactory } from "@/core/lib";
import { resolveMediaUrl } from "@/lib/media";
import {
  formatCartMoney,
  getLineTotal,
  getProductDescription,
  getProductHref,
  getProductImageUrl,
  getProductTitle,
  type StoreCartLine,
} from "../../cart/store-cart";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("CartSection", styles);

type CartRowGroupUIProps = {
  line: StoreCartLine;
  layoutStyle: "rows" | "cards";
  showDividerLines: boolean;
  isEditing?: boolean;
  onBumpQuantity: (lineId: string, delta: number) => void;
  onRemove: (lineId: string) => void;
};

export function CartRowGroupUI({
  line,
  layoutStyle,
  isEditing = false,
  onBumpQuantity,
  onRemove,
}: CartRowGroupUIProps) {
  const title = getProductTitle(line);
  const description = getProductDescription(line);
  const rawImageUrl = getProductImageUrl(line);
  const imageUrl = rawImageUrl
    ? resolveMediaUrl(rawImageUrl) ?? rawImageUrl
    : null;
  const href = getProductHref(line);
  const lineTotal = getLineTotal(line);
  const currency = line.product.currencyCode || "SYP";

  const itemClass =
    layoutStyle === "rows"
      ? getClassName("itemRow")
      : getClassName("itemCard");

  return (
    <article className={itemClass} dir="rtl">
      {imageUrl ? (
        <img className={getClassName("image")} src={imageUrl} alt="" />
      ) : (
        <div
          className={getClassName("image")}
          role="img"
          aria-label={title}
        />
      )}

      <div className={getClassName("body")}>
        <div className={getClassName("row")}>
          <div className={getClassName("titleBlock")}>
            <h3 className={getClassName("title")}>
              {isEditing ? (
                <span>{title}</span>
              ) : (
                <a href={href} className={getClassName("titleLink")}>
                  {title}
                </a>
              )}
            </h3>
            {description ? (
              <p className={getClassName("description")}>{description}</p>
            ) : null}
            <p className={getClassName("meta")}>
              {formatCartMoney(line.pricing.price, currency)} لكل قطعة
            </p>
          </div>
          <span className={getClassName("lineTotal")}>
            {formatCartMoney(lineTotal, currency)}
          </span>
        </div>

        <div className={getClassName("controls")}>
          <div className={getClassName("stepper")}>
            <button
              type="button"
              className={getClassName("stepBtn")}
              aria-label="تقليل الكمية"
              onClick={() => onBumpQuantity(line.lineId, -1)}
            >
              −
            </button>
            <span className={getClassName("qty")} aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              className={getClassName("stepBtn")}
              aria-label="زيادة الكمية"
              onClick={() => onBumpQuantity(line.lineId, 1)}
            >
              +
            </button>
          </div>
          <button
            type="button"
            className={getClassName("removeBtn")}
            onClick={() => onRemove(line.lineId)}
          >
            إزالة
          </button>
        </div>
      </div>
    </article>
  );
}
