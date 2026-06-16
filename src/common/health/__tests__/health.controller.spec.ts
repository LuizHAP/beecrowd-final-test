import { HealthController } from "../health.controller";

const mockLoggingService = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

describe("HealthController", () => {
  let controller: HealthController;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
    };
    controller = new HealthController(mockPrisma, mockLoggingService as any);
  });

  describe("check", () => {
    it("returns ok status when database query succeeds", async () => {
      mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await controller.check();

      expect(result.status).toBe("ok");
      expect(result.database).toBe("connected");
      expect(result.timestamp).toBeDefined();
    });

    it("throws 503 when database query fails", async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error("connection refused"));

      await expect(controller.check()).rejects.toThrow();
      expect(mockLoggingService.warn).toHaveBeenCalled();
    });
  });
});
