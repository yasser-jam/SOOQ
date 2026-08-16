import { lookupEnumEntry } from "../enum-labels";

describe("lookupEnumEntry", () => {
  it("maps known order statuses", () => {
    expect(lookupEnumEntry("orderStatus", "DELIVERED")).toEqual({
      label: "تم التسليم",
      variant: "success",
    });
  });

  it("returns undefined for unknown values", () => {
    expect(lookupEnumEntry("orderStatus", "NEW_STATUS")).toBeUndefined();
  });

  it("guards against prototype property names", () => {
    expect(lookupEnumEntry("orderStatus", "toString")).toBeUndefined();
  });
});
