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
    vi.useFakeTimers();
    service = new BackgroundJobService(mockPrisma as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('transitionPendingToProcessing', () => {
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

    it('handles unknown error type', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue('string error');
      const result = await service.transitionPendingToProcessing();
      expect(result.updated).toBe(0);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('start', () => {
    it('runs immediately on start', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
      const consoleSpy = vi.spyOn(console, 'log');
      service.start();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('sets up interval', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      service.start();
      expect(setIntervalSpy).toHaveBeenCalled();
      setIntervalSpy.mockRestore();
    });

    it('does not set up interval twice', () => {
      const setIntervalSpy = vi.spyOn(global, 'setInterval');
      service.start();
      service.start();
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      setIntervalSpy.mockRestore();
    });

    it('logs transited orders', async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
      const consoleSpy = vi.spyOn(console, 'log');
      service.start();
      await vi.advanceTimersByTimeAsync(1);
      expect(consoleSpy).toHaveBeenCalledWith('[BACKGROUND JOB] Transited 5 orders to PROCESSING');
      consoleSpy.mockRestore();
    });

    it('logs error on failure', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error('DB error'));
      const consoleSpy = vi.spyOn(console, 'error');
      service.start();
      await vi.advanceTimersByTimeAsync(1);
      expect(consoleSpy).toHaveBeenCalledWith('[BACKGROUND JOB] Error:', 'DB error');
      consoleSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('clears the interval', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      service.start();
      service.stop();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('is idempotent', () => {
      service.stop();
      service.stop();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
