"use client";
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useMemo, useState } from "react";
import { ComponentConfig } from "@/core/types";
import { RADIUS_OPTIONS, resolveRadius } from "../../content/typography-fields";
import { themeFixedSelectField } from "../../fields/ThemeFixedSelect";
import { useBoundData } from "../../binding";
import { resolveBoundImageUrls } from "../../binding/resolve-bound-images";

export type ProductImageCarouselProps = {
  placeholderSrc: string;
  radius: string;
  aspectRatio: "square" | "portrait" | "landscape";
};

const ASPECT_RATIO_MAP: Record<ProductImageCarouselProps["aspectRatio"], string> =
  {
    square: "1 / 1",
    portrait: "3 / 4",
    landscape: "4 / 3",
  };

function resolveImageUrls(data: Record<string, unknown> | null): string[] {
  if (!data) return [];
  return resolveBoundImageUrls(data);
}

export const ProductImageCarousel: ComponentConfig<ProductImageCarouselProps> = {
  label: "معرض صور المنتج",
  fields: {
    placeholderSrc: {
      type: "text",
      label: "صورة بديلة",
    },
    aspectRatio: {
      type: "radio",
      label: "قياس الصورة",
      options: [
        { label: "مربع", value: "square" },
        { label: "عمودي", value: "portrait" },
        { label: "أفقي", value: "landscape" },
      ],
    },
    radius: themeFixedSelectField({
      label: "زاوية الحدود",
      themeOptions: RADIUS_OPTIONS,
      type: "number",
      placeholder: "القيمة بالبكسل",
    }),
  },
  defaultProps: {
    placeholderSrc:
      "https://placehold.co/600x600/e2e8f0/64748b?text=Product",
    radius: "theme-md",
    aspectRatio: "square",
  },
  render: ({ placeholderSrc, radius, aspectRatio }) => {
    const { data } = useBoundData();
    const imageUrls = useMemo(() => resolveImageUrls(data), [data]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
      setActiveIndex(0);
    }, [data, imageUrls.length]);

    const resolvedRadius = resolveRadius(radius ?? "theme-md");
    const aspect = ASPECT_RATIO_MAP[aspectRatio ?? "square"];
    const hasImages = imageUrls.length > 0;
    const mainSrc = hasImages
      ? imageUrls[Math.min(activeIndex, imageUrls.length - 1)]
      : placeholderSrc;

    return (
      <div style={{ width: "100%", minWidth: 0 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: aspect,
            borderRadius: resolvedRadius,
            overflow: "hidden",
            background: "var(--theme-surface-muted, #f1f5f9)",
          }}
        >
          <img
            src={mainSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

        {imageUrls.length > 1 ? (
          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            {imageUrls.map((url, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={`${url}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`صورة ${index + 1}`}
                  aria-pressed={isActive}
                  style={{
                    width: 64,
                    height: 64,
                    padding: 0,
                    border: isActive
                      ? "2px solid var(--theme-primary, #3b82f6)"
                      : "1px solid var(--theme-border, #e2e8f0)",
                    borderRadius: resolvedRadius,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "transparent",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  },
};
