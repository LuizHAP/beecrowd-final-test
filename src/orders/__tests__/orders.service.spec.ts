import { NotFoundException } from "@nestjs/common";
import { OrdersService } from "../orders.service";
import type { PrismaOrderRepository } from "../prisma-order.repository";
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
  let mockRepo: jest.MockedObjectDeep<PrismaOrderRepository>;

  beforeEach(() => {
    mockRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      updateStatusIfPending: jest.fn(),
    } as unknown as jest.MockedObjectDeep<PrismaOrderRepository>;
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
      await expect(service.create({ items: undefined })).rejects.toThrow(
        "Order must contain at least one item",
      );
    });
  });

  describe("findAll", () => {
    it("returns all orders", async () => {
      const orders = [makeOrder({ id: "1" }), makeOrder({ id: "2" })];
      mockRepo.findAll.mockResolvedValue(orders);

      const result = await service.findAll({});

      expect(result).toEqual(orders);
      expect(mockRepo.findAll).toHaveBeenCalledWith(undefined);
    });

    it("filters by status", async () => {
      const orders = [makeOrder({ id: "1" })];
      mockRepo.findAll.mockResolvedValue(orders);

      const result = await service.findAll({ status: OrderStatus.PENDING });

      expect(result).toEqual(orders);
      expect(mockRepo.findAll).toHaveBeenCalledWith(OrderStatus.PENDING);
    });
  });

  describe("findOne", () => {
    it("returns order when found", async () => {
      const order = makeOrder({ id: "1" });
      mockRepo.findById.mockResolvedValue(order);

      const result = await service.findOne("1");

      expect(result).toBe(order);
      expect(mockRepo.findById).toHaveBeenCalledWith("1");
    });

    it("throws NotFoundException when order not found", async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.findOne("non-existent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("cancel", () => {
    it("cancels pending order", async () => {
      mockRepo.updateStatusIfPending.mockResolvedValue(true);

      await service.cancel("1");

      expect(mockRepo.updateStatusIfPending).toHaveBeenCalledWith(
        "1",
        OrderStatus.CANCELLED,
      );
    });

    it("throws BadRequestException if order not pending", async () => {
      mockRepo.updateStatusIfPending.mockResolvedValue(false);
      mockRepo.findById.mockResolvedValue(
        makeOrder({ id: "1", status: OrderStatus.DELIVERED }),
      );

      await expect(service.cancel("1")).rejects.toThrow(
        "Order cannot be cancelled. Current status: DELIVERED",
      );
    });

    it("throws NotFoundException if order not found", async () => {
      mockRepo.updateStatusIfPending.mockResolvedValue(false);
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.cancel("1")).rejects.toThrow("Order not found");
    });
  });

  describe("toResponseDto", () => {
    it("converts order to response DTO", () => {
      const order = makeOrder({
        id: "1",
        status: OrderStatus.PENDING,
        items: [makeItem()],
      });

      const result = service.toResponseDto(order);

      expect(result).toEqual({
        id: "1",
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
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
