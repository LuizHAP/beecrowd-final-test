import { HealthController } from "../health.controller";
import type { PrismaService } from "../../prisma/prisma.service";
import type { LoggingService } from "../../logging/logging.service";

describe("HealthController", () => {
  let controller: HealthController;
  let mockPrisma: jest.MockedObjectDeep<PrismaService>;

  beforeEach(() => {
    mockPrisma = {
      $queryRaw: jest.fn(),
    } as unknown as jest.MockedObjectDeep<PrismaService>;
    const mockLoggingService = {
      child: jest.fn().mockReturnThis(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      log: jest.fn(),
    } as unknown as LoggingService;
    controller = new HealthController(mockPrisma, mockLoggingService);
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
    });
  });
});
