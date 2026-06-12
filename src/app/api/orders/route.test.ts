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
    // Dynamically import to get fresh mock
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
});
