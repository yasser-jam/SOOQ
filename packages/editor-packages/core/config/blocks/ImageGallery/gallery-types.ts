export type GalleryImageItem = {
  src: string;
  alt: string;
};

export type ImageGalleryContentProps = {
  mode: "grid" | "slider";
  images: GalleryImageItem[];
  aspectRatio: "landscape" | "portrait" | "square";
  objectFit: "contain" | "cover" | "fill" | "none" | "scale-down";
  radius: string;
  gap: string;
  gridColumns: number;
  gridRows: number;
  slidesPerView: number;
  autoplay: boolean;
  autoplayDuration: string;
  showArrows: boolean;
};
