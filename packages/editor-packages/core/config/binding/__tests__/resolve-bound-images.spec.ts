import {
  resolveBoundImageUrl,
  resolveBoundImageUrls,
} from "../resolve-bound-images";

describe("resolveBoundImageUrls", () => {
  it("collects from images, gallery, product.media and primaryImageUrl in order", () => {
    const urls = resolveBoundImageUrls({
      images: ["https://a.test/1.jpg", { url: "https://a.test/2.jpg" }],
      gallery: [{ imageUrl: "https://a.test/3.jpg" }],
      product: {
        media: [{ thumbnailUrl: "https://a.test/4.jpg" }],
        primaryImageUrl: "https://a.test/5.jpg",
      },
    });

    expect(urls).toEqual([
      "https://a.test/1.jpg",
      "https://a.test/2.jpg",
      "https://a.test/3.jpg",
      "https://a.test/4.jpg",
      "https://a.test/5.jpg",
    ]);
  });

  it("dedupes repeated urls", () => {
    const urls = resolveBoundImageUrls({
      images: ["https://a.test/1.jpg"],
      product: { primaryImageUrl: "https://a.test/1.jpg" },
    });

    expect(urls).toEqual(["https://a.test/1.jpg"]);
  });

  it("skips empty/whitespace entries and unknown shapes", () => {
    const urls = resolveBoundImageUrls({
      images: ["  ", {}, { url: "" }, 42 as unknown as string],
    });

    expect(urls).toEqual([]);
  });

  it("resolveBoundImageUrl returns the first url or undefined", () => {
    expect(
      resolveBoundImageUrl({ images: [{ url: "https://a.test/x.jpg" }] })
    ).toBe("https://a.test/x.jpg");
    expect(resolveBoundImageUrl({})).toBeUndefined();
  });
});
