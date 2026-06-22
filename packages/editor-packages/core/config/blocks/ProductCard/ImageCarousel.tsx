"use client";
/* eslint-disable @next/next/no-img-element */
import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { getClassNameFactory } from "@/core/lib";
import styles from "./styles.module.css";

const getClassName = getClassNameFactory("ProductCard", styles);

type ImageCarouselProps = {
  urls: string[];
  alt: string;
  fallbackLabel?: string;
  objectFit?: "cover" | "contain";
  asBackground?: boolean;
};

function ProductSlide({
  url,
  alt,
  objectFit,
  asBackground,
}: {
  url: string;
  alt: string;
  objectFit: "cover" | "contain";
  asBackground: boolean;
}) {
  if (asBackground) {
    return (
      <div
        className={getClassName("imageBg")}
        style={{
          backgroundImage: `url(${url})`,
          backgroundSize: objectFit === "contain" ? "contain" : "cover",
          backgroundPosition: "center",
        }}
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={getClassName("image")}
      style={{ objectFit }}
    />
  );
}

export function ImageCarousel({
  urls,
  alt,
  fallbackLabel = "لا توجد صورة",
  objectFit = "cover",
  asBackground = false,
}: ImageCarouselProps) {
  const slides = urls.filter(Boolean);

  const dir =
    typeof document !== "undefined"
      ? ((document.documentElement.getAttribute("dir") as "rtl" | "ltr" | null) ??
        "rtl")
      : "rtl";

  if (slides.length === 0) {
    return <div className={getClassName("placeholder")}>{fallbackLabel}</div>;
  }

  if (slides.length === 1) {
    return (
      <div className={getClassName("carousel")}>
        <ProductSlide
          url={slides[0]!}
          alt={alt}
          objectFit={objectFit}
          asBackground={asBackground}
        />
      </div>
    );
  }

  return (
    <Carousel
      dir={dir}
      opts={{
        align: "start",
        loop: true,
        direction: dir,
      }}
      className={getClassName("carousel")}
    >
      <CarouselContent className="-ms-0">
        {slides.map((url, index) => (
          <CarouselItem key={`${url}-${index}`} className="ps-0">
            <ProductSlide
              url={url}
              alt={alt}
              objectFit={objectFit}
              asBackground={asBackground}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
