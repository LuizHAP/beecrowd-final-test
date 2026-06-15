import { Order } from "../order.entity";
import { OrderItem } from "../order-item.entity";
import { OrderStatus } from "../order-status";

describe("Order Entity", () => {
  const createOrder = (overrides = {}) => {
    const items = [
      new OrderItem({
        id: "1",
        productId: "prod-1",
        quantity: 2,
        unitPrice: 50,
      }),
    ];
    return new Order({
      id: "ord-1",
      status: OrderStatus.PENDING,
      items,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      ...overrides,
    });
  };

  describe("total getter", () => {
    it("should calculate total from items", () => {
      const order = createOrder();
      expect(order.total).toBe(100);
    });

    it("should return 0 for empty items", () => {
      const order = new Order({
        id: "ord-2",
        status: OrderStatus.PENDING,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(order.total).toBe(0);
    });

    it("should sum multiple items correctly", () => {
      const items = [
        new OrderItem({ id: "1", productId: "p1", quantity: 3, unitPrice: 10 }),
        new OrderItem({ id: "2", productId: "p2", quantity: 2, unitPrice: 25 }),
      ];
      const order = new Order({
        id: "ord-3",
        status: OrderStatus.PENDING,
        items,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(order.total).toBe(80);
    });
  });

  describe("canCancel", () => {
    it("should return true for PENDING orders", () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.canCancel()).toBe(true);
    });

    it("should return false for PROCESSING orders", () => {
      const order = createOrder({ status: OrderStatus.PROCESSING });
      expect(order.canCancel()).toBe(false);
    });

    it("should return false for SHIPPED orders", () => {
      const order = createOrder({ status: OrderStatus.SHIPPED });
      expect(order.canCancel()).toBe(false);
    });

    it("should return false for DELIVERED orders", () => {
      const order = createOrder({ status: OrderStatus.DELIVERED });
      expect(order.canCancel()).toBe(false);
    });

    it("should return false for CANCELLED orders", () => {
      const order = createOrder({ status: OrderStatus.CANCELLED });
      expect(order.canCancel()).toBe(false);
    });
  });

  describe("cancel", () => {
    it("should set status to CANCELLED", () => {
      const order = createOrder();
      order.cancel();
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it("should update updatedAt timestamp", () => {
      const before = new Date();
      const order = createOrder();
      order.cancel();
      expect(order.updatedAt).toBeInstanceOf(Date);
      expect(order.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it("should throw if order is not cancellable", () => {
      const order = createOrder({ status: OrderStatus.PROCESSING });
      expect(() => order.cancel()).toThrow("Order cannot be cancelled");
    });

    it("should throw for SHIPPED status", () => {
      const order = createOrder({ status: OrderStatus.SHIPPED });
      expect(() => order.cancel()).toThrow("Order cannot be cancelled");
    });

    it("should throw for DELIVERED status", () => {
      const order = createOrder({ status: OrderStatus.DELIVERED });
      expect(() => order.cancel()).toThrow("Order cannot be cancelled");
    });
  });
});
