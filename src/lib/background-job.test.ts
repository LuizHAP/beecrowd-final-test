import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transitionPendingToProcessing } from './background-job';
import { prisma } from './prisma';

// Mock Prisma
vi.mock('./prisma', () => ({
  prisma: {
    $executeRawUnsafe: vi.fn(),
  },
}));

describe('transitionPendingToProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns updated count on success', async () => {
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(5);
    const result = await transitionPendingToProcessing();
    expect(result.updated).toBe(5);
    expect(result.error).toBeUndefined();
  });

  it('returns 0 updated when no orders found', async () => {
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(0);
    const result = await transitionPendingToProcessing();
    expect(result.updated).toBe(0);
  });

  it('returns error on failure', async () => {
    vi.mocked(prisma.$executeRawUnsafe).mockRejectedValue(new Error('DB connection failed'));
    const result = await transitionPendingToProcessing();
    expect(result.updated).toBe(0);
    expect(result.error).toBe('DB connection failed');
  });

  it('uses SKIP LOCKED for concurrency safety', async () => {
    vi.mocked(prisma.$executeRawUnsafe).mockResolvedValue(3);
    await transitionPendingToProcessing();
    expect(prisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE SKIP LOCKED')
    );
  });
});
