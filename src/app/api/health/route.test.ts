import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 when database is connected', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '1': 1 }]);

    const res = await GET(new Request('http://localhost:3000/api/health'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.database).toBe('connected');
  });

  it('returns 503 when database is disconnected', async () => {
    const { GET } = await import('./route');
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection refused'));

    const res = await GET(new Request('http://localhost:3000/api/health'));
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe('degraded');
    expect(data.database).toBe('disconnected');
  });
});
