import {
  evaluateDataCondition,
  normalizeDataCondition,
} from "../show-condition";

describe("normalizeDataCondition", () => {
  it("returns null for invalid values", () => {
    expect(normalizeDataCondition(null)).toBeNull();
    expect(normalizeDataCondition({})).toBeNull();
    expect(normalizeDataCondition({ path: "  " })).toBeNull();
  });

  it("defaults op to truthy", () => {
    expect(normalizeDataCondition({ path: "order.discountAmount" })).toEqual({
      path: "order.discountAmount",
      op: "truthy",
      value: undefined,
    });
  });
});

describe("evaluateDataCondition", () => {
  it("treats zero and empty collections as falsy", () => {
    expect(
      evaluateDataCondition(
        { path: "order.discountAmount", op: "truthy" },
        0
      )
    ).toBe(false);
    expect(
      evaluateDataCondition({ path: "order.items", op: "truthy" }, [])
    ).toBe(false);
    expect(
      evaluateDataCondition({ path: "order.notes", op: "truthy" }, "   ")
    ).toBe(false);
  });

  it("compares eq/neq using stringified values", () => {
    expect(
      evaluateDataCondition(
        { path: "order.itemCount", op: "eq", value: 3 },
        "3"
      )
    ).toBe(true);
    expect(
      evaluateDataCondition(
        { path: "order.itemCount", op: "neq", value: 3 },
        3
      )
    ).toBe(false);
  });

  it("matches in only when value is an array", () => {
    expect(
      evaluateDataCondition(
        { path: "order.orderStatus", op: "in", value: ["DELIVERED", "COMPLETED"] },
        "DELIVERED"
      )
    ).toBe(true);
    expect(
      evaluateDataCondition(
        { path: "order.orderStatus", op: "in", value: "DELIVERED" },
        "DELIVERED"
      )
    ).toBe(false);
  });
});
