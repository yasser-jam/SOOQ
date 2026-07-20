import {
  buildPaginationWindow,
  validatePaginationItemValues,
  type PaginationButtonItem,
} from "../pagination-utils";

const baseItem = (value: string): PaginationButtonItem => ({
  title: value,
  value,
});

describe("validatePaginationItemValues", () => {
  it("accepts numeric-only values", () => {
    expect(
      validatePaginationItemValues([baseItem("1"), baseItem("12")])
    ).toBe(true);
  });

  it("rejects non-numeric values", () => {
    expect(
      validatePaginationItemValues([baseItem("1"), baseItem("next")])
    ).toBe(false);
  });
});

describe("buildPaginationWindow", () => {
  it("returns all pages when totalPages <= 7", () => {
    expect(buildPaginationWindow(5, 2)).toEqual([1, 2, 3, 4, 5]);
  });

  it("inserts ellipsis for long ranges", () => {
    expect(buildPaginationWindow(20, 10)).toEqual([
      1,
      "ellipsis",
      9,
      10,
      11,
      "ellipsis",
      20,
    ]);
  });
});
