import { PrismaOrderRepository } from "../prisma-order.repository";
import { Order } from "../../domain/order/order.entity";
import { OrderItem } from "../../domain/order/order-item.entity";
import { OrderStatus } from "../../domain/order/order-status";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return new Order({
    id: "order-1",
    status: OrderStatus.PENDING,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe("PrismaOrderRepository", () => {
  let repo: PrismaOrderRepository;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    repo = new PrismaOrderRepository(mockPrisma as any);
  });

  describe("findById", () => {
    it("returns order with items", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: "order-1",
        status: "PENDING",
        items: [
          { id: "item-1", productId: "prod-1", quantity: 2, unitPrice: 10 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.findById("order-1");

      expect(result).toBeInstanceOf(Order);
      expect(result!.id).toBe("order-1");
      expect(result!.status).toBe(OrderStatus.PENDING);
      expect(result!.items).toHaveLength(1);
      expect(result!.total).toBe(20);
    });

    it("returns null when order not found", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      const result = await repo.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("returns all orders", async () => {
      mockPrisma.order.findMany.mockResolvedValue([
        {
          id: "order-1",
          status: "PENDING",
          items: [
            { id: "item-1", productId: "prod-1", quantity: 1, unitPrice: 10 },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await repo.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Order);
    });

    it("filters by status", async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      await repo.findAll("PENDING");
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "PENDING" } }),
      );
    });

    it("orders by createdAt desc", async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      await repo.findAll();
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: "desc" } }),
      );
    });
  });

  describe("create", () => {
    it("creates order with items", async () => {
      const order = makeOrder({
        id: "order-1",
        items: [
          new OrderItem({
            id: "item-1",
            productId: "prod-1",
            quantity: 2,
            unitPrice: 10,
          }),
        ],
      });

      mockPrisma.order.create.mockResolvedValue({
        id: "order-1",
        status: "PENDING",
        items: [
          { id: "item-1", productId: "prod-1", quantity: 2, unitPrice: 10 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repo.create(order);

      expect(result).toBeInstanceOf(Order);
      expect(result!.items).toHaveLength(1);
    });
  });

  describe("updateStatus", () => {
    it("updates order status", async () => {
      await repo.updateStatus("order-1", "CANCELLED");

      expect(mockPrisma.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "CANCELLED" },
      });
    });
  });
});
