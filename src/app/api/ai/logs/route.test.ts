import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    aILog: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/ai/logs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all logs without filter', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.aILog.findMany).mockResolvedValue([]);

    const res = await GET(new Request('http://localhost:3000/api/ai/logs'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.logs).toEqual([]);
  });

  it('filters by intent', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.aILog.findMany).mockResolvedValue([]);

    const res = await GET(new Request('http://localhost:3000/api/ai/logs?intent=CANCEL_ORDER'));
    expect(res.status).toBe(200);
  });

  it('filters by injection detection', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.aILog.findMany).mockResolvedValue([]);

    const res = await GET(new Request('http://localhost:3000/api/ai/logs?injection=true'));
    expect(res.status).toBe(200);
  });

  it('limits results', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.aILog.findMany).mockResolvedValue([]);

    const res = await GET(new Request('http://localhost:3000/api/ai/logs?limit=10'));
    expect(res.status).toBe(200);
  });
});
