import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('GET /api/orders/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns order details with total', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'test-id',
      status: 'PENDING' as const,
      items: [
        { id: 'item-1', productId: 'prod-1', quantity: 2, unitPrice: 10 },
        { id: 'item-2', productId: 'prod-2', quantity: 3, unitPrice: 5 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await GET(
      new Request('http://localhost:3000/api/orders/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('test-id');
    expect(data.total).toBe(35); // 2*10 + 3*5 = 35
  });

  it('returns 404 for non-existent order', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const res = await GET(
      new Request('http://localhost:3000/api/orders/non-existent'),
      { params: Promise.resolve({ id: 'non-existent' }) }
    );

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/orders/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels PENDING order', async () => {
    const { DELETE } = await import('./route');
    const mockOrder = {
      id: 'test-id',
      status: 'PENDING' as const,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder);
    vi.mocked(prisma.order.delete).mockResolvedValue(mockOrder);

    const res = await DELETE(
      new Request('http://localhost:3000/api/orders/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe('Order cancelled');
  });

  it('rejects cancellation of PROCESSING order', async () => {
    const { DELETE } = await import('./route');
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'test-id',
      status: 'PROCESSING' as const,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await DELETE(
      new Request('http://localhost:3000/api/orders/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain('cannot be cancelled');
  });

  it('rejects cancellation of SHIPPED order', async () => {
    const { DELETE } = await import('./route');
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'test-id',
      status: 'SHIPPED' as const,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await DELETE(
      new Request('http://localhost:3000/api/orders/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );

    expect(res.status).toBe(409);
  });

  it('rejects cancellation of DELIVERED order', async () => {
    const { DELETE } = await import('./route');
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'test-id',
      status: 'DELIVERED' as const,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await DELETE(
      new Request('http://localhost:3000/api/orders/test-id'),
      { params: Promise.resolve({ id: 'test-id' }) }
    );

    expect(res.status).toBe(409);
  });

  it('returns 404 for non-existent order', async () => {
    const { DELETE } = await import('./route');
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const res = await DELETE(
      new Request('http://localhost:3000/api/orders/non-existent'),
      { params: Promise.resolve({ id: 'non-existent' }) }
    );

    expect(res.status).toBe(404);
  });
});
