import {
  formatCartMoney,
  getLineTotal,
  getProductDescription,
  getProductImageUrl,
  getProductTitle,
  type StoreCartLine,
} from "./store-cart";

/** Bound payload shape for cart line valueContext paths (mirrors product card API). */
export function mapCartLineToBoundData(line: StoreCartLine) {
  const imageUrl = getProductImageUrl(line);
  const unitPrice = line.pricing.price;
  const lineTotal = getLineTotal(line);
  const currency = line.product.currencyCode || "SYP";
  const titleAr = line.product.titleAr || getProductTitle(line, "ar");
  const titleEn = line.product.titleEn || getProductTitle(line, "en");
  const descriptionAr =
    line.product.descriptionAr || getProductDescription(line, "ar");
  const descriptionEn =
    line.product.descriptionEn || getProductDescription(line, "en");

  return {
    lineId: line.lineId,
    quantity: line.quantity,
    product: {
      productId: line.product.id,
      titleAr,
      titleEn,
      descriptionAr,
      descriptionEn,
      slug: line.product.slug,
    },
    images: imageUrl ? [{ url: imageUrl }] : [],
    pricing: {
      price: unitPrice,
      displayPrice: formatCartMoney(unitPrice, currency),
      lineTotal,
      displayLineTotal: formatCartMoney(lineTotal, currency),
    },
  };
}

export function createDemoCartLine(): StoreCartLine {
  return {
    lineId: "demo-line",
    quantity: 1,
    product: {
      id: "demo-product",
      titleAr: "منتج تجريبي",
      titleEn: "Demo product",
      descriptionAr: "وصف المنتج يظهر هنا.",
      descriptionEn: "Product description appears here.",
      slug: "demo-product",
      basePrice: 25000,
      compareAtPrice: 0,
      currencyCode: "SYP",
      status: "ACTIVE",
      allowOversell: false,
      categories: [],
      tags: [],
      mediaUrls: [
        "https://placehold.co/144x144/e2e8f0/64748b?text=Product",
      ],
      options: [],
      variants: [],
    },
    selectedVariant: null,
    selectedAttributes: {},
    pricing: {
      price: 25000,
      compareAt: null,
      discountPercent: 0,
      hasDiscount: false,
    },
    language: "ar",
    metadata: null,
    addedAt: new Date().toISOString(),
  };
}
