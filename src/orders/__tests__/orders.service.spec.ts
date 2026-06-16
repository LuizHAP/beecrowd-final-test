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
      updateStatusIfPending: jest.fn(),
    };
    service = new OrdersService(mockRepo);
  });

  describe("create", () => {
    it("creates an order with items", async () => {
      const createdOrder = makeOrder({
        id: "test-id",
        items: [makeItem()],
      });
      mockRepo.create.mockResolvedValue(createdOrder);

      const result = await service.create({
        items: [{ productId: "prod-1", quantity: 2, unitPrice: 10 }],
      });
      expect(result).toBe(createdOrder);
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it("throws if no items provided", async () => {
      await expect(service.create({ items: [] })).rejects.toThrow(
        "Order must contain at least one item",
      );
    });

    it("throws if items is undefined", async () => {
      // @ts-expect-error testing undefined items
      await expect(service.create({})).rejects.toThrow(
        "Order must contain at least one item",
      );
    });

    it("throws if items is null", async () => {
      // @ts-expect-error testing null items
      await expect(service.create({ items: null })).rejects.toThrow(
        "Order must contain at least one item",
      );
    });

    it("throws for invalid item data", async () => {
      await expect(
        service.create({
          items: [{ productId: "", quantity: 0, unitPrice: -1 }],
        }),
      ).rejects.toThrow();
    });
  });

  describe("findAll", () => {
    it("returns all orders when no status filter", async () => {
      mockRepo.findAll.mockResolvedValue([]);
      const result = await service.findAll({});
      expect(result).toEqual([]);
      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it("filters by status when provided", async () => {
      mockRepo.findAll.mockResolvedValue([]);
      await service.findAll({ status: "PENDING" });
      expect(mockRepo.findAll).toHaveBeenCalledWith("PENDING");
    });

    it("returns orders with items", async () => {
      const orders = [makeOrder({ items: [makeItem()] })];
      mockRepo.findAll.mockResolvedValue(orders);
      const result = await service.findAll({});
      expect(result).toEqual(orders);
    });
  });

  describe("findOne", () => {
    it("returns order by id", async () => {
      const order = makeOrder();
      mockRepo.findById.mockResolvedValue(order);
      const result = await service.findOne("test-id");
      expect(result).toBe(order);
    });

    it("throws 404 when order not found", async () => {
      mockRepo.findById.mockResolvedValue(null);
      await expect(service.findOne("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("cancel", () => {
    it("cancels PENDING order atomically", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.updateStatusIfPending.mockResolvedValue(true);

      const result = await service.cancel("test-id");
      expect(result).toBeUndefined();
      expect(mockRepo.updateStatusIfPending).toHaveBeenCalledWith(
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
      mockRepo.updateStatusIfPending.mockResolvedValue(false);
      await expect(service.cancel("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("handles atomic update failure (race condition)", async () => {
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [],
      });
      mockRepo.findById.mockResolvedValue(order);
      mockRepo.updateStatusIfPending.mockResolvedValue(false);
      mockRepo.findById.mockResolvedValueOnce(
        makeOrder({ id: "test-id", status: OrderStatus.PROCESSING, items: [] }),
      );
      await expect(service.cancel("test-id")).rejects.toThrow();
    });
  });

  describe("toResponseDto", () => {
    it("should convert an Order to OrderResponseDto", () => {
      const item = makeItem({
        id: "item-1",
        productId: "prod-1",
        quantity: 2,
        unitPrice: 10,
      });
      const order = makeOrder({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [item],
      });
      const dto = service.toResponseDto(order);
      expect(dto).toEqual({
        id: "test-id",
        status: OrderStatus.PENDING,
        items: [
          {
            id: "item-1",
            productId: "prod-1",
            quantity: 2,
            unitPrice: 10,
          },
        ],
        total: 20,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      });
    });
  });
});
