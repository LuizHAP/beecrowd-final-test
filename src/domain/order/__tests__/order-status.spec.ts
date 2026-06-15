import {
  OrderStatus,
  isCancellable,
  CANCELLABLE_STATUSES,
} from "../order-status";

describe("OrderStatus enum", () => {
  it("should have all expected statuses", () => {
    expect(OrderStatus.PENDING).toBe("PENDING");
    expect(OrderStatus.PROCESSING).toBe("PROCESSING");
    expect(OrderStatus.SHIPPED).toBe("SHIPPED");
    expect(OrderStatus.DELIVERED).toBe("DELIVERED");
    expect(OrderStatus.CANCELLED).toBe("CANCELLED");
  });
});

describe("CANCELLABLE_STATUSES", () => {
  it("should only contain PENDING", () => {
    expect(CANCELLABLE_STATUSES).toEqual([OrderStatus.PENDING]);
  });
});

describe("isCancellable", () => {
  it("should return true for PENDING", () => {
    expect(isCancellable(OrderStatus.PENDING)).toBe(true);
  });

  it("should return false for PROCESSING", () => {
    expect(isCancellable(OrderStatus.PROCESSING)).toBe(false);
  });

  it("should return false for SHIPPED", () => {
    expect(isCancellable(OrderStatus.SHIPPED)).toBe(false);
  });

  it("should return false for DELIVERED", () => {
    expect(isCancellable(OrderStatus.DELIVERED)).toBe(false);
  });

  it("should return false for CANCELLED", () => {
    expect(isCancellable(OrderStatus.CANCELLED)).toBe(false);
  });
});
