"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useMemo } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import type { GalleryImageItem, ImageGalleryContentProps } from "./gallery-types";
import { resolveRadius } from "../../content/typography-fields";

type GalleryViewProps = ImageGalleryContentProps;

const ASPECT_RATIO: Record<string, string> = {
  landscape: "16 / 9",
  portrait: "3 / 4",
  square: "1 / 1",
};

function resolveGap(value: string | undefined): string {
  if (!value) return "16px";
  if (value.startsWith("theme-")) return `${value.slice(6)}px`;
  return value.includes("px") ? value : `${value}px`;
}

function resolveDurationMs(value: string | undefined): number {
  if (!value) return 4000;
  if (value.startsWith("theme-")) {
    const sec = Number(value.slice(6));
    return Number.isFinite(sec) ? sec * 1000 : 4000;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n * 1000 : 4000;
}

function GalleryImage({
  item,
  radius,
  aspectRatio,
  objectFit,
}: {
  item: GalleryImageItem;
  radius: string;
  aspectRatio: string;
  objectFit: GalleryViewProps["objectFit"];
}) {
  const r = resolveRadius(radius ?? "theme-md");
  return (
    <img
      src={item.src}
      alt={item.alt ?? ""}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: objectFit ?? "cover",
        borderRadius: r,
        aspectRatio: ASPECT_RATIO[aspectRatio] ?? ASPECT_RATIO.landscape,
      }}
    />
  );
}

function GridGallery({
  images,
  gridColumns,
  gridRows,
  gap,
  radius,
  aspectRatio,
  objectFit,
}: GalleryViewProps) {
  const cols = Math.min(Math.max(gridColumns ?? 3, 1), 6);
  const rows = gridRows ?? 0;
  const gapPx = resolveGap(gap);
  const visible =
    rows > 0 ? images.slice(0, cols * rows) : images;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: "auto",
        gap: gapPx,
        width: "100%",
      }}
    >
      {visible.map((item, i) => (
        <GalleryImage
          key={`${item.src}-${i}`}
          item={item}
          radius={radius}
          aspectRatio={aspectRatio ?? "landscape"}
          objectFit={objectFit}
        />
      ))}
    </div>
  );
}

function SliderGallery({
  images,
  slidesPerView,
  autoplay,
  autoplayDuration,
  showArrows,
  gap,
  radius,
  aspectRatio,
  objectFit,
}: GalleryViewProps) {
  const perView = Math.min(Math.max(slidesPerView ?? 1, 1), 4) as 1 | 2 | 3 | 4;
  const gapPx = resolveGap(gap);
  const durationMs = resolveDurationMs(autoplayDuration);
  const dir =
    typeof document !== "undefined"
      ? (document.documentElement.getAttribute("dir") as "rtl" | "ltr" | null) ?? "rtl"
      : "rtl";

  const autoplayPlugin = useMemo(
    () => (autoplay ? Autoplay({ delay: durationMs, stopOnInteraction: true }) : null),
    [autoplay, durationMs]
  );

  const plugins = autoplayPlugin ? [autoplayPlugin] : undefined;

  const itemFlexBasis = `${100 / perView}%`;

  return (
    <Carousel
      dir={dir}
      opts={{
        align: "start",
        loop: true,
        direction: dir,
      }}
      plugins={plugins}
      className="w-full"
    >
      <CarouselContent style={{ marginInlineStart: `-${gapPx}` }}>
        {images.map((item, i) => (
          <CarouselItem
            key={`${item.src}-${i}`}
            style={{
              flex: `0 0 ${itemFlexBasis}`,
              paddingInlineStart: gapPx,
            }}
          >
            <GalleryImage
              item={item}
              radius={radius}
              aspectRatio={aspectRatio ?? "landscape"}
              objectFit={objectFit}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      {showArrows && (
        <>
          <CarouselPrevious />
          <CarouselNext />
        </>
      )}
    </Carousel>
  );
}

export function GalleryView(props: GalleryViewProps) {
  const images = props.images ?? [];
  if (images.length === 0) {
    return (
      <div style={{ padding: 8, color: "var(--theme-color-neutral)" }}>
        أضف صورة واحدة على الأقل
      </div>
    );
  }

  if (props.mode === "slider") {
    return <SliderGallery {...props} images={images} />;
  }

  return <GridGallery {...props} images={images} />;
}
