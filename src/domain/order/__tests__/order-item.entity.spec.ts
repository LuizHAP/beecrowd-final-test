import { OrderItem } from "../order-item.entity";

describe("OrderItem Entity", () => {
  const validData = {
    id: "1",
    productId: "prod-1",
    quantity: 2,
    unitPrice: 50,
  };

  describe("constructor validation", () => {
    it("should create with valid data", () => {
      const item = new OrderItem(validData);
      expect(item.productId).toBe("prod-1");
      expect(item.quantity).toBe(2);
      expect(item.unitPrice).toBe(50);
    });

    it("should throw if productId is empty string", () => {
      expect(() => new OrderItem({ ...validData, productId: "" })).toThrow(
        "Product ID is required",
      );
    });

    it("should throw if productId is whitespace only", () => {
      expect(() => new OrderItem({ ...validData, productId: "   " })).toThrow(
        "Product ID is required",
      );
    });

    it("should throw if quantity is zero", () => {
      expect(() => new OrderItem({ ...validData, quantity: 0 })).toThrow(
        "Quantity must be greater than 0",
      );
    });

    it("should throw if quantity is negative", () => {
      expect(() => new OrderItem({ ...validData, quantity: -1 })).toThrow(
        "Quantity must be greater than 0",
      );
    });

    it("should throw if unitPrice is negative", () => {
      expect(() => new OrderItem({ ...validData, unitPrice: -1 })).toThrow(
        "Unit price cannot be negative",
      );
    });

    it("should allow zero unitPrice", () => {
      const item = new OrderItem({ ...validData, unitPrice: 0 });
      expect(item.unitPrice).toBe(0);
    });
  });

  describe("subtotal getter", () => {
    it("should calculate subtotal correctly", () => {
      const item = new OrderItem({ ...validData, quantity: 3, unitPrice: 10 });
      expect(item.subtotal).toBe(30);
    });

    it("should throw for zero quantity", () => {
      expect(
        () => new OrderItem({ ...validData, quantity: 0, unitPrice: 100 }),
      ).toThrow("Quantity must be greater than 0");
    });

    it("should handle decimal prices", () => {
      const item = new OrderItem({
        ...validData,
        quantity: 2,
        unitPrice: 9.99,
      });
      expect(item.subtotal).toBe(19.98);
    });
  });
});
