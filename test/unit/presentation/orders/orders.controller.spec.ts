import { OrdersController } from '@/orders/orders.controller';
import { CreateOrderDto, ListOrdersDto } from '@/orders/dto';

describe('OrdersController', () => {
  let controller: OrdersController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      cancel: jest.fn(),
    };
    controller = new OrdersController(mockService);
  });

  describe('create', () => {
    it('delegates to ordersService.create', async () => {
      const mockResult = {
        id: 'order-1',
        status: 'PENDING',
        items: [],
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.create.mockResolvedValue(mockResult);

      const dto: CreateOrderDto = {
        items: [{ productId: 'prod-1', quantity: 1, unitPrice: 10 }],
      };
      const result = await controller.create(dto);

      expect(mockService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findAll', () => {
    it('delegates to ordersService.findAll with no filters', async () => {
      const mockResult: Array<{ id: string; status: string; items: any[]; total: number; createdAt: Date; updatedAt: Date }> = [];
      mockService.findAll.mockResolvedValue(mockResult);

      const dto: ListOrdersDto = {};
      const result = await controller.findAll(dto);

      expect(mockService.findAll).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });

    it('delegates to ordersService.findAll with status filter', async () => {
      const mockResult: Array<{ id: string; status: string; items: any[]; total: number; createdAt: Date; updatedAt: Date }> = [];
      mockService.findAll.mockResolvedValue(mockResult);

      const dto: ListOrdersDto = { status: 'PENDING' };
      const result = await controller.findAll(dto);

      expect(mockService.findAll).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('findOne', () => {
    it('delegates to ordersService.findOne', async () => {
      const mockResult = {
        id: 'order-1',
        status: 'PENDING',
        items: [],
        total: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockService.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne('order-1');

      expect(mockService.findOne).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('cancel', () => {
    it('delegates to ordersService.cancel', async () => {
      const mockResult = { message: 'Order cancelled', order: { id: 'order-1', status: 'CANCELLED' } };
      mockService.cancel.mockResolvedValue(mockResult);

      const result = await controller.cancel('order-1');

      expect(mockService.cancel).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(mockResult);
    });
  });
});
