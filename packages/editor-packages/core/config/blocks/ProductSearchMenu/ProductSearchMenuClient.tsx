"use client";
/* eslint-disable @next/next/no-img-element */
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import { getClassNameFactory } from "@/core/lib";
import {
  products,
  formatPrice,
  discountedPrice,
  type Product,
} from "../../data/products";
import styles from "./styles.module.css";
import type { ProductSearchMenuProps } from "./types";

const getClassName = getClassNameFactory("ProductSearchMenu", styles);

function displayPrice(p: Product): { current: string; was?: string } {
  const hasDiscount =
    typeof p.discount === "number" && p.discount > 0;
  if (hasDiscount) {
    return {
      current: formatPrice(discountedPrice(p.price, p.discount!)),
      was: formatPrice(p.price),
    };
  }
  return { current: formatPrice(p.price) };
}

function matchesQuery(p: Product, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    p.title,
    p.description,
    ...p.categories,
    ...p.collections,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(s);
}

export function ProductSearchMenuClient({
  buttonLabel,
  searchPlaceholder,
  menuHeading,
  maxResults,
}: ProductSearchMenuProps) {
  const headingId = useId();
  const cap =
    typeof maxResults === "number" && !Number.isNaN(maxResults)
      ? maxResults
      : 0;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [box, setBox] = useState({ top: 0, left: 0, width: 420 });

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.min(420, window.innerWidth - 16);
    let left = r.left;
    if (left + w > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - w - 8);
    }
    setBox({
      top: r.bottom + 8,
      left,
      width: w,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent | PointerEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  const filtered = useMemo(() => {
    const list = products.filter((p) => matchesQuery(p, query));
    if (cap > 0 && list.length > cap) {
      return list.slice(0, cap);
    }
    return list;
  }, [query, cap]);

  const portal =
    open &&
    typeof document !== "undefined" &&
    createPortal(
      <>
        <button
          type="button"
          className={getClassName("backdrop")}
          aria-hidden
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
        <div
          ref={panelRef}
          className={getClassName("popover")}
          style={{
            position: "fixed",
            top: box.top,
            left: box.left,
            width: box.width,
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
        >
          <div className={getClassName("header")}>
            <h2 id={headingId} className={getClassName("heading")}>
              {menuHeading}
            </h2>
            <input
              ref={searchInputRef}
              type="search"
              className={getClassName("input")}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className={getClassName("list")}>
            {filtered.length === 0 ? (
              <div className={getClassName("empty")}>
                No products match your search. Try another keyword.
              </div>
            ) : (
              filtered.map((p) => {
                const { current, was } = displayPrice(p);
                return (
                  <a
                    key={p.id}
                    href={`#product-${p.id}`}
                    className={getClassName("card")}
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                    }}
                  >
                    <img
                      className={getClassName("thumb")}
                      src={p.image}
                      alt=""
                      width={64}
                      height={64}
                    />
                    <div className={getClassName("cardBody")}>
                      <div className={getClassName("cardTitle")}>{p.title}</div>
                      <div className={getClassName("cardMeta")}>
                        {was && (
                          <span className={getClassName("price--strike")}>
                            {was}
                          </span>
                        )}
                        <span className={getClassName("price")}>{current}</span>
                        {typeof p.discount === "number" && p.discount > 0 && (
                          <span className={getClassName("badge")}>
                            −{p.discount}%
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>
          <div className={getClassName("footer")}>
            Demo catalog from <code>config/data/products.ts</code>
          </div>
        </div>
      </>,
      document.body
    );

  return (
    <div className={getClassName()}>
      <button
        ref={triggerRef}
        type="button"
        className={getClassName("trigger")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) updatePosition();
        }}
      >
        <span className={getClassName("triggerIcon")} aria-hidden>
          <Search size={18} strokeWidth={2.25} />
        </span>
        {buttonLabel}
      </button>
      {portal}
    </div>
  );
}
