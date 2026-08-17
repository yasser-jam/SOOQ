/**
 * The renderer reads products from the PUBLIC catalogue only.
 *
 * Listing used to cost one authenticated
 * `/admin/products/{id}?include=PRICING&include=IMAGES&include=INVENTORY`
 * request per card — an endpoint apps/store has no credentials for. Product
 * blocks now browse `/public/products?page=0&size=20` and read detail from
 * `/public/products/{slug}`; these tests pin that down by recording every URL
 * the data adapter is asked for.
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Render, resolveAllData } from "@/core";

import conf from "../index";
import {
  registerEditorDataAdapter,
  sampleEditorDataAdapter,
  type CollectionProductRef,
  type EditorDataAdapter,
} from "../data-adapter";
import { composePuckData, normalizeSiteData } from "../lib/site-data";
import { createSection } from "../presets/shared";
import { createProductCardBlock, createProductsGridSection } from "../presets/products-grid";

const API = "https://api.test/api/v1";

const CATALOGUE: CollectionProductRef[] = [
  {
    id: "ae0f7b62-443f-48d3-8018-0063c32a962e",
    titleAr: "كنبة ميلانو قماش ٣ مقاعد",
    titleEn: "Milano 3-Seater Fabric Sofa",
    slug: "milano-sofa",
    basePrice: 640,
    compareAtPrice: 780,
    currencyCode: "SYP",
    displayPrice: "640.00 SYP",
    primaryImageUrl: "/api/v1/public/media/tenant/sofa.jpg",
    status: "ACTIVE",
  },
  {
    id: "ef9668d3-ccb8-4135-989e-704dc62865ec",
    titleAr: "كنبة زاوية حلب",
    titleEn: "Aleppo L-Shaped Corner Sofa",
    slug: "aleppo-corner-sofa",
    basePrice: 1150,
    compareAtPrice: 1390,
    currencyCode: "USD",
    displayPrice: "1,150.00 USD",
    primaryImageUrl: "/api/v1/public/media/tenant/corner.jpg",
    status: "ACTIVE",
  },
];

let requestedUrls: string[] = [];

const testAdapter: EditorDataAdapter = {
  ...sampleEditorDataAdapter,
  getCollectionProductsApiUrl: (slug) =>
    `${API}/public/collections/${slug}/products?page=0&size=50`,
  fetchCollectionProducts: async (apiUrl) => {
    requestedUrls.push(apiUrl);
    return CATALOGUE;
  },
  getProductsPageApiUrl: (query) =>
    `${API}/public/products?page=${query.page}&size=${query.size}`,
  fetchProductsPage: async (apiUrl) => {
    requestedUrls.push(apiUrl);
    return { items: CATALOGUE, totalItems: CATALOGUE.length, totalPages: 1 };
  },
  buildPublicProductResourceMetadata: (slug, id) => ({
    type: "product",
    method: "get",
    apiUrl: `${API}/public/products/${slug}`,
    id: id ?? slug,
  }),
  fetchProductDetailPayload: async (apiUrl) => {
    requestedUrls.push(apiUrl);
    const slug = apiUrl.split("/").pop();
    const product = CATALOGUE.find((item) => item.slug === slug);
    if (!product) return null;
    return {
      product: {
        productId: product.id,
        titleAr: product.titleAr,
        titleEn: product.titleEn,
        slug: product.slug,
        primaryImageUrl: product.primaryImageUrl,
      },
      pricing: {
        basePrice: product.basePrice,
        compareAtPrice: product.compareAtPrice,
        currencyCode: product.currencyCode,
        displayPrice: product.displayPrice,
      },
    };
  },
};

async function renderPage(content: unknown[]) {
  const site = normalizeSiteData({
    root: { props: {} },
    zones: {},
    pages: [{ path: "/", slug: "/", name: "Home", link: "/", content }],
  } as any);

  // The storefront resolves data before rendering (useStorefrontData), which
  // is where blocks compute their `metadata` API URLs.
  const data = await resolveAllData(
    composePuckData(site, "/") as any,
    conf as any
  );

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <Render config={conf as any} data={data as any} />
    </QueryClientProvider>
  );
}

describe("storefront product listing uses the public catalogue", () => {
  beforeEach(() => {
    requestedUrls = [];
    registerEditorDataAdapter(testAdapter);
  });

  afterEach(() => {
    registerEditorDataAdapter(sampleEditorDataAdapter);
  });

  it("browses /public/products?page=0&size=20 when no collection is picked", async () => {
    await renderPage([createProductsGridSection()]);

    await waitFor(() => {
      expect(screen.getByText("كنبة ميلانو قماش ٣ مقاعد")).toBeTruthy();
    });

    expect(screen.getByText("كنبة زاوية حلب")).toBeTruthy();
    expect(requestedUrls).toContain(`${API}/public/products?page=0&size=20`);
  });

  it("still uses the collection endpoint when the section picks a collection", async () => {
    await renderPage([
      createProductsGridSection({
        collection: { id: "col-1", name: "الأكثر مبيعاً", slug: "bestsellers" },
      }),
    ]);

    await waitFor(() => {
      expect(screen.getByText("كنبة ميلانو قماش ٣ مقاعد")).toBeTruthy();
    });

    expect(requestedUrls).toContain(
      `${API}/public/collections/bestsellers/products?page=0&size=50`
    );
    expect(
      requestedUrls.some((url) => url.includes("/public/products?"))
    ).toBe(false);
  });

  it("resolves a card whose saved ref has no slug through the listing", async () => {
    // Refs picked before the picker stored slugs carry only an id — the old
    // code turned those into /admin/products/{id}. (A standalone card, not a
    // grid template: the grid strips per-card product refs by design.)
    await renderPage([
      createSection({
        name: "Featured",
        content: [
          createProductCardBlock({
            product: { id: CATALOGUE[0]!.id, titleAr: CATALOGUE[0]!.titleAr },
          }),
        ],
      }),
    ]);

    await waitFor(() => {
      expect(requestedUrls).toContain(`${API}/public/products/milano-sofa`);
    });

    expect(requestedUrls).toContain(`${API}/public/products?page=0&size=20`);
  });

  it("never asks for an /admin/ URL", async () => {
    await renderPage([
      createProductsGridSection(),
      createSection({
        name: "Featured",
        content: [
          createProductCardBlock({
            product: { id: CATALOGUE[1]!.id, slug: CATALOGUE[1]!.slug },
          }),
        ],
      }),
    ]);

    await waitFor(() => {
      expect(requestedUrls.length).toBeGreaterThan(0);
    });

    expect(requestedUrls.filter((url) => url.includes("/admin/"))).toEqual([]);
  });
});
