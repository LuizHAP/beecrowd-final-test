import { OrdersController } from "../orders.controller";
import { CreateOrderDto, ListOrdersDto } from "../dto";

interface MockOrdersService {
  create: jest.Mock;
  findAll: jest.Mock;
  findOne: jest.Mock;
  cancel: jest.Mock;
}

describe("OrdersController", () => {
  let controller: OrdersController;
  let mockService: MockOrdersService;

  beforeEach(() => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
    };
    controller = new OrdersController(mockService as never);
  });

  describe("create", () => {
    it("delegates to ordersService.create", async () => {
      const mockResult = {
        id: "order-1",
        status: "PENDING",
        items: [],
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.create.mockResolvedValue(mockResult);

      const dto: CreateOrderDto = {
        items: [{ productId: "prod-1", quantity: 1, unitPrice: 10 }],
      };
      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe("findAll", () => {
    it("delegates to ordersService.findAll with no filters", async () => {
      mockService.findAll.mockResolvedValue([]);

      const dto: ListOrdersDto = {};
      const result = await controller.findAll(dto);

      expect(mockService.findAll).toHaveBeenCalledWith(dto);
      expect(result).toEqual([]);
    });

    it("delegates to ordersService.findAll with status filter", async () => {
      mockService.findAll.mockResolvedValue([]);

      const dto: ListOrdersDto = { status: "PENDING" };
      const result = await controller.findAll(dto);

      expect(mockService.findAll).toHaveBeenCalledWith(dto);
      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("delegates to ordersService.findOne", async () => {
      const mockResult = {
        id: "order-1",
        status: "PENDING",
        items: [],
        total: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne("order-1");

      expect(mockService.findOne).toHaveBeenCalledWith("order-1");
      expect(result).toEqual(mockResult);
    });
  });

  describe("cancel", () => {
    it("delegates to ordersService.cancel", async () => {
      const mockResult = {
        message: "Order cancelled",
        order: { id: "order-1", status: "CANCELLED" },
      };
      mockService.cancel.mockResolvedValue(mockResult);

      const result = await controller.cancel("order-1");

      expect(mockService.cancel).toHaveBeenCalledWith("order-1");
      expect(result).toEqual(mockResult);
    });
  });
});
