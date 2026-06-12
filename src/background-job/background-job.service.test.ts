import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackgroundJobService } from './background-job.service';

const mockPrisma = {
  $executeRawUnsafe: vi.fn(),
};

vi.mock('../common/prisma/prisma.service', () => ({
  PrismaService: vi.fn(() => mockPrisma),
}));

describe('BackgroundJobService', () => {
  let service: BackgroundJobService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BackgroundJobService(mockPrisma as any);
  });

  it('returns updated count on success', async () => {
    mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
    const result = await service.transitionPendingToProcessing();
    expect(result.updated).toBe(5);
    expect(result.error).toBeUndefined();
  });

  it('returns 0 when no orders found', async () => {
    mockPrisma.$executeRawUnsafe.mockResolvedValue(0);
    const result = await service.transitionPendingToProcessing();
    expect(result.updated).toBe(0);
  });

  it('returns error on failure', async () => {
    mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('DB connection failed'));
    const result = await service.transitionPendingToProcessing();
    expect(result.updated).toBe(0);
    expect(result.error).toBe('DB connection failed');
  });

  it('uses SKIP LOCKED for concurrency safety', async () => {
    mockPrisma.$executeRawUnsafe.mockResolvedValue(3);
    await service.transitionPendingToProcessing();
    expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE SKIP LOCKED')
    );
  });
});
