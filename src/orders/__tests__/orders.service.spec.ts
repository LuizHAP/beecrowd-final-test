import { NotFoundException } from "@nestjs/common";
import { OrdersService } from "../orders.service";
import { Order } from "../../domain/order/order.entity";
import { OrderItem } from "../../domain/order/order-item.entity";
import { OrderStatus } from "../../domain/order/order-status";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return new Order({
    id: "test-id",
    status: OrderStatus.PENDING,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function makeItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return new OrderItem({
    id: "item-1",
    productId: "prod-1",
    quantity: 2,
    unitPrice: 10,
    ...overrides,
  });
}

describe("OrdersService", () => {
  let service: OrdersService;
  let mockRepo: any;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };
    service = new OrdersService(mockRepo);
  });

  describe("create", () => {
    it("creates an order with items", async () => {
      const createdOrder = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [
          makeItem({
            id: "item-1",
            productId: "prod-1",
            quantity: 2,
            unitPrice: 10,
          }),
        ],
      });
      mockRepo.create.mockResolvedValue(createdOrder);

      const result = await service.create({
        items: [{ productId: "prod-1", quantity: 2, unitPrice: 10 }],
      });

      expect(result.status).toBe("PENDING");
      expect(result.total).toBe(20);
    });

    it("rejects empty items", async () => {
      await expect(service.create({ items: [] })).rejects.toThrow();
    });

    it("rejects invalid quantity", async () => {
      await expect(
        service.create({
          items: [{ productId: "prod-1", quantity: 0, unitPrice: 10 }],
        }),
      ).rejects.toThrow("Quantity must be greater than 0");
    });

    it("rejects negative unit price", async () => {
      await expect(
        service.create({
          items: [{ productId: "prod-1", quantity: 1, unitPrice: -5 }],
        }),
      ).rejects.toThrow("Unit price cannot be negative");
    });

    it("rejects empty productId", async () => {
      await expect(
        service.create({
          items: [{ productId: "", quantity: 1, unitPrice: 10 }],
        }),
      ).rejects.toThrow("Product ID is required");
    });

    it("calculates total correctly", async () => {
      const createdOrder = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [
          makeItem({
            id: "item-1",
            productId: "prod-1",
            quantity: 2,
            unitPrice: 10,
          }),
          makeItem({
            id: "item-2",
            productId: "prod-2",
            quantity: 3,
            unitPrice: 5,
          }),
        ],
      });
      mockRepo.create.mockResolvedValue(createdOrder);

      const result = await service.create({
        items: [
          { productId: "prod-1", quantity: 2, unitPrice: 10 },
          { productId: "prod-2", quantity: 3, unitPrice: 5 },
        ],
      });

      expect(result.total).toBe(35);
    });
  });

  describe("findAll", () => {
    it("lists all orders", async () => {
      mockRepo.findAll.mockResolvedValue([]);
      const result = await service.findAll({});
      expect(Array.isArray(result)).toBe(true);
    });

    it("filters by status", async () => {
      mockRepo.findAll.mockResolvedValue([]);
      await service.findAll({ status: "PENDING" });
      expect(mockRepo.findAll).toHaveBeenCalledWith("PENDING");
    });

    it("returns orders with items and total", async () => {
      const orders = [
        makeOrder({
          id: "order-1",
          status: OrderStatus.PENDING,
          items: [
            makeItem({ productId: "prod-1", quantity: 2, unitPrice: 10 }),
          ],
        }),
      ];
      mockRepo.findAll.mockResolvedValue(orders);

      const result = await service.findAll({});
      expect(result).toHaveLength(1);
      expect(result[0].total).toBe(20);
    });
  });

  describe("findOne", () => {
    it("returns order details", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [makeItem({ productId: "prod-1", quantity: 1, unitPrice: 100 })],
      });
      mockRepo.findById.mockResolvedValue(order);

      const result = await service.findOne("test-id");
      expect(result.id).toBe("test-id");
      expect(result.total).toBe(100);
    });

    it("throws 404 for non-existent order", async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findOne("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("handles order with null items", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);

      const result = await service.findOne("test-id");
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("cancel", () => {
    it("cancels PENDING order", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.updateStatus.mockResolvedValue(undefined);

      const result = await service.cancel("test-id");
      expect(result.message).toBe("Order cancelled");
      expect(mockRepo.updateStatus).toHaveBeenCalledWith(
        "test-id",
        OrderStatus.CANCELLED,
      );
    });

    it("rejects PROCESSING order", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.PROCESSING,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);
      await expect(service.cancel("test-id")).rejects.toThrow();
    });

    it("rejects SHIPPED order", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.SHIPPED,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);
      await expect(service.cancel("test-id")).rejects.toThrow();
    });

    it("rejects DELIVERED order", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.DELIVERED,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);
      await expect(service.cancel("test-id")).rejects.toThrow();
    });

    it("rejects CANCELLED order", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.CANCELLED,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);
      await expect(service.cancel("test-id")).rejects.toThrow();
    });

    it("throws 404 for non-existent order", async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.cancel("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
