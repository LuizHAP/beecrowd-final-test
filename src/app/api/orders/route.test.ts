import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an order with items', async () => {
    const { POST } = await import('./route');

    const mockOrder = {
      id: 'test-id',
      status: 'PENDING' as const,
      items: [{ id: 'item-1', productId: 'prod-1', quantity: 2, unitPrice: 10 }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.order.create).mockResolvedValue(mockOrder);

    const res = await POST(new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'prod-1', quantity: 2, unitPrice: 10 }],
      }),
    }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe('PENDING');
    expect(data.total).toBe(20);
  });

  it('rejects empty items array', async () => {
    const { POST } = await import('./route');
    const res = await POST(new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    }));
    expect(res.status).toBe(400);
  });

  it('rejects missing items', async () => {
    const { POST } = await import('./route');
    const res = await POST(new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(400);
  });

  it('rejects invalid quantity', async () => {
    const { POST } = await import('./route');
    const res = await POST(new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'prod-1', quantity: 0, unitPrice: 10 }] }),
    }));
    expect(res.status).toBe(400);
  });

  it('rejects negative unit price', async () => {
    const { POST } = await import('./route');
    const res = await POST(new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'prod-1', quantity: 1, unitPrice: -5 }] }),
    }));
    expect(res.status).toBe(400);
  });

  it('calculates total price correctly', async () => {
    const { POST } = await import('./route');

    const mockOrder = {
      id: 'test-id',
      status: 'PENDING' as const,
      items: [
        { id: 'item-1', productId: 'prod-1', quantity: 2, unitPrice: 10 },
        { id: 'item-2', productId: 'prod-2', quantity: 3, unitPrice: 5 },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.order.create).mockResolvedValue(mockOrder);

    const res = await POST(new Request('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          { productId: 'prod-1', quantity: 2, unitPrice: 10 },
          { productId: 'prod-2', quantity: 3, unitPrice: 5 },
        ],
      }),
    }));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.total).toBe(35); // 2*10 + 3*5 = 35
  });
});

describe('GET /api/orders', () => {
  it('lists all orders without filter', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);

    const res = await GET(new Request('http://localhost:3000/api/orders'));
    expect(res.status).toBe(200);
  });

  it('filters by status', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.order.findMany).mockResolvedValue([]);

    const res = await GET(new Request('http://localhost:3000/api/orders?status=PENDING'));
    expect(res.status).toBe(200);
  });

  it('calculates total for each order', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: 'order-1',
        status: 'PENDING' as const,
        items: [
          { id: 'item-1', productId: 'prod-1', quantity: 2, unitPrice: 10 },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const res = await GET(new Request('http://localhost:3000/api/orders'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].total).toBe(20);
  });
});
