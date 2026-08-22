"use client";

import React from "react";
import {
  Bookmark,
  LucideIcon,
  Package,
  Palette,
  ShoppingCart,
  Smartphone,
  Truck,
} from "lucide-react";
import { ComponentConfig, CustomField } from "@/core/types";
import { colorField } from "../../fields/ColorField";
import {
  SPLASH_HERO_DEFAULT_PROPS,
  SPLASH_HERO_EDITABLE_KEYS,
  type SplashHeroProps,
} from "./constants";
import styles from "./styles.module.css";

export type { SplashHeroProps } from "./constants";
export {
  SPLASH_HERO_DEFAULT_PROPS,
  SPLASH_HERO_EDITABLE_KEYS,
  SPLASH_HERO_PLACEHOLDER_IMAGE,
  reconcileSplashHeroProps,
} from "./constants";

/** Editor-canvas preview only — the mobile engine reads `icon.name` (Material icon keys) directly. */
const ICON_PREVIEW_MAP: Record<string, LucideIcon> = {
  shopping_cart: ShoppingCart,
  smartphone: Smartphone,
  palette: Palette,
  inventory_2: Package,
  local_shipping: Truck,
  bookmark: Bookmark,
};

/**
 * `Fields<Props>` requires an entry per prop, but only the image and the six colours are meant to
 * be editable — everything else is locked by the mobile engine contract. These placeholders fill
 * the type and are stripped by `resolveFields` below before the panel ever renders them.
 */
const lockedField = <Value,>(label: string): CustomField<Value> => ({
  type: "custom",
  label,
  render: ({ field }) => (
    <p className={styles.lockedField}>{field.label} — ثابت</p>
  ),
});

const RING_RADIUS = 100;
const RING_CENTER = 110;
const ICON_SIZE = 44;

function ringPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  return {
    left: RING_CENTER + RING_RADIUS * Math.cos(angle) - ICON_SIZE / 2,
    top: RING_CENTER + RING_RADIUS * Math.sin(angle) - ICON_SIZE / 2,
  };
}

/**
 * The mobile app's launch screen. Only the image and the six colour fields are authorable — the
 * icon ring, headline copy, button label and tap target are fixed by the mobile engine contract
 * (see `./constants.ts`), so they carry no field and cannot be edited from the panel.
 *
 * Always present on `/splash` and never draggable from the palette — it is seeded and reconciled
 * by `config/lib/site-data.ts`, not inserted by hand.
 */
export const SplashHero: ComponentConfig<SplashHeroProps> = {
  label: "شاشة البداية",
  permissions: {
    drag: false,
    duplicate: false,
    delete: false,
    insert: false,
  },
  fields: {
    image: { type: "text", label: "رابط الصورة" },
    background: colorField({ label: "لون الخلفية" }),
    decorColor: colorField({ label: "لون الزخرفة" }),
    accentColor: colorField({ label: "اللون المميز" }),
    headlineColor: colorField({ label: "لون العنوان" }),
    buttonColor: colorField({ label: "لون الزر" }),
    buttonTextColor: colorField({ label: "لون نص الزر" }),
    // Locked by the mobile engine contract — declared only to satisfy `Fields<Props>`'s
    // exhaustiveness, then stripped by `resolveFields` below so the panel never shows them.
    imageFit: lockedField("طريقة عرض الصورة"),
    icons: lockedField("حلقة الأيقونات"),
    headline: lockedField("العنوان"),
    buttonLabel: lockedField("نص الزر"),
    tap: lockedField("وجهة الزر"),
  },
  resolveFields: (_data, { fields }) => {
    const editable = new Set<string>(SPLASH_HERO_EDITABLE_KEYS);
    const next = { ...fields };
    (Object.keys(next) as (keyof SplashHeroProps)[]).forEach((key) => {
      if (!editable.has(key)) delete next[key];
    });
    return next;
  },
  defaultProps: SPLASH_HERO_DEFAULT_PROPS,
  render: ({
    image,
    background,
    decorColor,
    accentColor,
    icons,
    headline,
    headlineColor,
    buttonLabel,
    buttonColor,
    buttonTextColor,
  }) => {
    const total = icons.length || 1;

    return (
      <div className={styles.root} style={{ background, color: decorColor }}>
        <div className={styles.decorRing}>
          <span className={styles.decorCircle} />
          <span className={styles.accentDot} style={{ background: accentColor }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.image} src={image} alt="" />
          {icons.map((icon, index) => {
            const Icon = ICON_PREVIEW_MAP[icon.name] ?? Package;
            const pos = ringPosition(index, total);
            return (
              <span
                key={`${icon.name}-${index}`}
                className={styles.icon}
                style={{
                  left: pos.left,
                  top: pos.top,
                  background: icon.background || "#FFFFFF",
                  color: icon.color,
                }}
              >
                <Icon size={20} strokeWidth={2} color={icon.color} />
              </span>
            );
          })}
        </div>

        <p className={styles.headline} style={{ color: headlineColor }}>
          {headline}
        </p>

        <span
          className={styles.button}
          style={{ background: buttonColor, color: buttonTextColor }}
        >
          {buttonLabel}
        </span>
      </div>
    );
  },
};
