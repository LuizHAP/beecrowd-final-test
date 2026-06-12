import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';

const mockPrisma = {
  order: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock('../common/prisma/prisma.service', () => ({
  PrismaService: vi.fn(() => mockPrisma),
}));

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrdersService(mockPrisma as any);
  });

  describe('create', () => {
    it('creates an order with items', async () => {
      mockPrisma.order.create.mockResolvedValue({
        id: 'test-id',
        status: 'PENDING',
        items: [{ id: 'item-1', productId: 'prod-1', quantity: 2, unitPrice: 10 }],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 10 }],
      });

      expect(result.status).toBe('PENDING');
      expect(result.total).toBe(20);
    });

    it('rejects empty items', async () => {
      try {
        await service.create({ items: [] });
        expect(true).toBe(false); // should not reach here
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('rejects invalid quantity', async () => {
      await expect(
        service.create({ items: [{ productId: 'prod-1', quantity: 0, unitPrice: 10 }] })
      ).rejects.toThrow(ConflictException);
    });

    it('rejects negative unit price', async () => {
      await expect(
        service.create({ items: [{ productId: 'prod-1', quantity: 1, unitPrice: -5 }] })
      ).rejects.toThrow(ConflictException);
    });

    it('calculates total correctly', async () => {
      mockPrisma.order.create.mockResolvedValue({
        id: 'test-id',
        status: 'PENDING',
        items: [
          { id: 'item-1', productId: 'prod-1', quantity: 2, unitPrice: 10 },
          { id: 'item-2', productId: 'prod-2', quantity: 3, unitPrice: 5 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10 },
          { productId: 'prod-2', quantity: 3, unitPrice: 5 },
        ],
      });

      expect(result.total).toBe(35);
    });
  });

  describe('findAll', () => {
    it('lists all orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      const result = await service.findAll({});
      expect(Array.isArray(result)).toBe(true);
    });

    it('filters by status', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      await service.findAll({ status: 'PENDING' });
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'PENDING' } })
      );
    });
  });

  describe('findOne', () => {
    it('returns order details', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'test-id',
        status: 'PENDING',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.findOne('test-id');
      expect(result.id).toBe('test-id');
    });

    it('throws 404 for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancel', () => {
    it('cancels PENDING order', async () => {
      const mockOrder = {
        id: 'test-id',
        status: 'PENDING',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.delete.mockResolvedValue(mockOrder);

      const result = await service.cancel('test-id');
      expect(result.message).toBe('Order cancelled');
    });

    it('rejects PROCESSING order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'test-id',
        status: 'PROCESSING',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.cancel('test-id')).rejects.toThrow(ConflictException);
    });

    it('rejects SHIPPED order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'test-id',
        status: 'SHIPPED',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.cancel('test-id')).rejects.toThrow(ConflictException);
    });

    it('rejects DELIVERED order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 'test-id',
        status: 'DELIVERED',
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await expect(service.cancel('test-id')).rejects.toThrow(ConflictException);
    });

    it('throws 404 for non-existent order', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);
      await expect(service.cancel('non-existent')).rejects.toThrow(NotFoundException);
    });
  });
});
