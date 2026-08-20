import {
  firstDropdownValue,
  resolveDropdownGroups,
  type DropdownOptionSource,
} from "../ContentDropdown/options";

const source = (
  overrides: Partial<DropdownOptionSource>
): DropdownOptionSource => ({
  mode: "static",
  groupLabel: { ar: "", en: "" },
  values: [],
  sourcePath: "",
  titlePath: "",
  valuePath: "",
  ...overrides,
});

const context = (
  overrides: Partial<Parameters<typeof resolveDropdownGroups>[1]> = {}
) => ({
  data: null,
  locale: "ar" as const,
  categories: [],
  ...overrides,
});

describe("static option sources", () => {
  it("picks the active language and keeps the typed value", () => {
    const groups = resolveDropdownGroups(
      [
        source({
          groupLabel: { ar: "المقاس", en: "Size" },
          values: [
            { title: { ar: "صغير", en: "Small" }, value: "s" },
            { title: { ar: "كبير", en: "Large" }, value: "l" },
          ],
        }),
      ],
      context({ locale: "en" })
    );

    expect(groups).toEqual([
      {
        label: "Size",
        options: [
          { title: "Small", value: "s" },
          { title: "Large", value: "l" },
        ],
      },
    ]);
  });

  it("falls back to the title when no value was typed", () => {
    const groups = resolveDropdownGroups(
      [source({ values: [{ title: "أحمر", value: "" }] })],
      context()
    );

    expect(groups[0]?.options).toEqual([{ title: "أحمر", value: "أحمر" }]);
  });
});

describe("bound (repeater) option sources", () => {
  const payload = {
    variantMatrix: {
      variants: [
        {
          variantId: "v-1",
          attributes: { Color: "أحمر", Size: "M" },
          titleEn: "Red / M",
        },
        { variantId: "v-2", attributes: { Color: "أزرق", Size: "L" } },
        { variantId: "", attributes: { Color: "بلا معرّف" } },
      ],
    },
  };

  it("maps each row through titlePath / valuePath", () => {
    const groups = resolveDropdownGroups(
      [
        source({
          mode: "bound",
          groupLabel: { ar: "المتغيّر", en: "Variant" },
          sourcePath: "variantMatrix.variants",
          titlePath: "attributes",
          valuePath: "variantId",
        }),
      ],
      context({ data: payload })
    );

    expect(groups).toEqual([
      {
        label: "المتغيّر",
        options: [
          { title: "أحمر / M", value: "v-1" },
          { title: "أزرق / L", value: "v-2" },
        ],
      },
    ]);
  });

  it("resolves the *Ar / *En sibling of a bilingual titlePath", () => {
    const groups = resolveDropdownGroups(
      [
        source({
          mode: "bound",
          sourcePath: "variantMatrix.variants",
          titlePath: "title",
          valuePath: "variantId",
        }),
      ],
      context({ data: payload, locale: "en" })
    );

    // Row 1 has `titleEn`; row 2 has no title at all, so it shows its value.
    expect(groups[0]?.options).toEqual([
      { title: "Red / M", value: "v-1" },
      { title: "v-2", value: "v-2" },
    ]);
  });

  it("returns nothing when the path is missing or not an array", () => {
    expect(
      resolveDropdownGroups(
        [source({ mode: "bound", sourcePath: "variantMatrix", valuePath: "id" })],
        context({ data: payload })
      )
    ).toEqual([]);

    expect(
      resolveDropdownGroups(
        [source({ mode: "bound", sourcePath: "", valuePath: "id" })],
        context({ data: payload })
      )
    ).toEqual([]);
  });

  it("composes a title from a nested array with the [] wildcard", () => {
    // The real storefront payload shape: a variant carries its labels as
    // optionValues rows, with no flat title field to point at.
    const storefrontPayload = {
      variantMatrix: {
        variants: [
          {
            variantId: "v-1",
            optionValues: [
              { optionValueId: "ov-1", valueAr: "أحمر", valueEn: "Red" },
              { optionValueId: "ov-2", valueAr: "وسط", valueEn: "Medium" },
            ],
          },
          { variantId: "v-2", optionValues: [] },
        ],
      },
    };

    const groups = resolveDropdownGroups(
      [
        source({
          mode: "bound",
          sourcePath: "variantMatrix.variants",
          titlePath: "optionValues[].value",
          valuePath: "variantId",
        }),
      ],
      context({ data: storefrontPayload })
    );

    expect(groups[0]?.options).toEqual([
      { title: "أحمر / وسط", value: "v-1" },
      // No option values at all — falls back to the variant id.
      { title: "v-2", value: "v-2" },
    ]);
  });

  it("supports arrays of primitives via empty paths", () => {
    const groups = resolveDropdownGroups(
      [source({ mode: "bound", sourcePath: "sizes" })],
      context({ data: { sizes: ["S", "M", "L"] } })
    );

    expect(groups[0]?.options).toEqual([
      { title: "S", value: "S" },
      { title: "M", value: "M" },
      { title: "L", value: "L" },
    ]);
  });
});

describe("productVariants option sources", () => {
  const storefrontPayload = {
    variantMatrix: {
      variants: [
        {
          variantId: "v-1",
          sku: "SKU-1",
          optionValues: [
            { optionValueId: "ov-1", valueAr: "رمادي", valueEn: "Grey" },
          ],
        },
        {
          variantId: "v-2",
          sku: "SKU-2",
          optionValues: [
            { optionValueId: "ov-2", valueAr: "بيج", valueEn: "Beige" },
          ],
        },
      ],
    },
  };

  it("reads variantMatrix.variants without any merchant-typed path", () => {
    const groups = resolveDropdownGroups(
      [source({ mode: "productVariants", sourcePath: "", titlePath: "", valuePath: "" })],
      context({ data: storefrontPayload })
    );

    expect(groups[0]?.options).toEqual([
      { title: "رمادي", value: "v-1" },
      { title: "بيج", value: "v-2" },
    ]);
  });

  it("ignores a merchant-typed sourcePath/titlePath/valuePath on the same row", () => {
    // The fixed paths win regardless of whatever a "bound" row on the same block might have had —
    // there is nothing here for the merchant to misconfigure.
    const groups = resolveDropdownGroups(
      [
        source({
          mode: "productVariants",
          sourcePath: "wrong.path",
          titlePath: "sku",
          valuePath: "sku",
        }),
      ],
      context({ data: storefrontPayload })
    );

    expect(groups[0]?.options).toEqual([
      { title: "رمادي", value: "v-1" },
      { title: "بيج", value: "v-2" },
    ]);
  });

  it("returns nothing when there is no bound payload", () => {
    expect(
      resolveDropdownGroups([source({ mode: "productVariants" })], context())
    ).toEqual([]);
  });
});

describe("category option sources", () => {
  it("maps the store category list to slug values", () => {
    const groups = resolveDropdownGroups(
      [source({ mode: "categories" })],
      context({
        categories: [
          { id: "1", slug: "shoes", nameAr: "أحذية", nameEn: "Shoes" },
          { id: "2", slug: "bags", nameAr: "حقائب" },
        ],
      })
    );

    expect(groups[0]?.options).toEqual([
      { title: "أحذية", value: "shoes" },
      { title: "حقائب", value: "bags" },
    ]);
  });
});

describe("cross-source rules", () => {
  it("de-duplicates values across sources and drops emptied groups", () => {
    const groups = resolveDropdownGroups(
      [
        source({
          groupLabel: "أولاً",
          values: [{ title: "واحد", value: "1" }],
        }),
        source({
          groupLabel: "ثانياً",
          values: [{ title: "واحد مكرّر", value: "1" }],
        }),
      ],
      context()
    );

    expect(groups).toEqual([
      { label: "أولاً", options: [{ title: "واحد", value: "1" }] },
    ]);
  });

  it("exposes the first selectable value for bound selectors", () => {
    const groups = resolveDropdownGroups(
      [source({ values: [{ title: "أ", value: "a" }] })],
      context()
    );

    expect(firstDropdownValue(groups)).toBe("a");
    expect(firstDropdownValue([])).toBe("");
  });
});
