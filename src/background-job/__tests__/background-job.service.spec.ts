import { BackgroundJobService } from "../background-job.service";

const mockPrisma = {
  $executeRawUnsafe: jest.fn(),
};

jest.mock("../../common/prisma/prisma.service", () => ({
  PrismaService: jest.fn(() => mockPrisma),
}));

describe("BackgroundJobService", () => {
  let service: BackgroundJobService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    service = new BackgroundJobService(mockPrisma as any);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("transitionPendingToProcessing", () => {
    it("returns updated count on success", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
      const result = await service.transitionPendingToProcessing();
      expect(result.updated).toBe(5);
      expect(result.error).toBeUndefined();
    });

    it("returns 0 when no orders found", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(0);
      const result = await service.transitionPendingToProcessing();
      expect(result.updated).toBe(0);
    });

    it("returns error on failure", async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(
        new Error("DB connection failed"),
      );
      const result = await service.transitionPendingToProcessing();
      expect(result.updated).toBe(0);
      expect(result.error).toBe("DB connection failed");
    });

    it("handles unknown error type", async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue("string error");
      const result = await service.transitionPendingToProcessing();
      expect(result.updated).toBe(0);
      expect(result.error).toBe("Unknown error");
    });
  });

  describe("onModuleInit", () => {
    it("starts the job outside test environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      const startSpy = jest
        .spyOn(service, "start")
        .mockImplementation(() => undefined);

      await service.onModuleInit();

      expect(startSpy).toHaveBeenCalled();
      startSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it("skips start in test environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      const startSpy = jest
        .spyOn(service, "start")
        .mockImplementation(() => undefined);

      await service.onModuleInit();

      expect(startSpy).not.toHaveBeenCalled();
      startSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("start", () => {
    it("runs transition on interval tick", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(3);
      service.start();
      mockPrisma.$executeRawUnsafe.mockClear();
      await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
    });

    it("logs error on interval tick failure", async () => {
      mockPrisma.$executeRawUnsafe
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce({ updated: 0, error: "interval failure" });
      service.start();
      await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(2);
    });

    it("runs immediately on start", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
      const consoleSpy = jest.spyOn(console, "log");
      service.start();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("sets up interval", () => {
      const setIntervalSpy = jest.spyOn(global, "setInterval");
      service.start();
      expect(setIntervalSpy).toHaveBeenCalled();
      setIntervalSpy.mockRestore();
    });

    it("does not set up interval twice", () => {
      const setIntervalSpy = jest.spyOn(global, "setInterval");
      service.start();
      service.start();
      expect(setIntervalSpy).toHaveBeenCalledTimes(1);
      setIntervalSpy.mockRestore();
    });

    it("logs transited orders", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
      const consoleSpy = jest.spyOn(console, "log");
      service.start();
      await jest.advanceTimersByTimeAsync(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[BACKGROUND JOB] Transited 5 orders to PROCESSING",
      );
      consoleSpy.mockRestore();
    });

    it("logs error on failure", async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error("DB error"));
      const consoleSpy = jest.spyOn(console, "error");
      service.start();
      await jest.advanceTimersByTimeAsync(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[BACKGROUND JOB] Error:",
        "DB error",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("stop", () => {
    it("clears the interval", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");
      service.start();
      service.stop();
      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it("is idempotent", () => {
      service.stop();
      service.stop();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
