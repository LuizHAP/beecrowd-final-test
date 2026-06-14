import { HealthController } from '@/common/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
    };
    controller = new HealthController(mockPrisma);
  });

  describe('check', () => {
    it('returns ok status when database query succeeds', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.check();

      expect(result.status).toBe('ok');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('returns degraded status when database query fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('connection refused'));

      const result = await controller.check();

      expect(result.status).toBe('degraded');
      expect(result.database).toBe('disconnected');
    });
  });
});
