import { BackgroundJobService } from "../background-job.service";

const mockPrisma = {
  $executeRawUnsafe: jest.fn(),
};

const mockLoggingService = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
};

jest.mock("../../common/prisma/prisma.service", () => ({
  PrismaService: jest.fn(() => mockPrisma),
}));

describe("BackgroundJobService", () => {
  let service: BackgroundJobService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockPrisma.$executeRawUnsafe.mockReset();
    service = new BackgroundJobService(
      mockPrisma as any,
      mockLoggingService as any,
    );
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
      mockPrisma.$executeRawUnsafe
        .mockReset()
        .mockRejectedValue("string error");
      const result = await service.transitionPendingToProcessing();
      expect(result.updated).toBe(0);
      expect(result.error).toBe("Unknown error");
      expect((service as any).running).toBe(false);
    });

    it("skips execution when job is already running", async () => {
      (service as any).running = true;
      const result = await service.transitionPendingToProcessing();
      expect(result.updated).toBe(0);
      expect(mockLoggingService.warn).toHaveBeenCalledWith(
        "Skipping job — previous execution still running",
      );
    });

    it("resets running flag after error", async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error("DB error"));
      await service.transitionPendingToProcessing();
      expect((service as any).running).toBe(false);
    });

    it("resets running flag after success", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(3);
      await service.transitionPendingToProcessing();
      expect((service as any).running).toBe(false);
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

    it("runs immediately on start", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
      service.start();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalled();
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

    it("logs transited orders via LoggingService", async () => {
      mockPrisma.$executeRawUnsafe.mockResolvedValue(5);
      service.start();
      await jest.advanceTimersByTimeAsync(1);
      expect(mockLoggingService.info).toHaveBeenCalledWith(
        "Orders transitioned to PROCESSING",
        expect.objectContaining({ count: 5 }),
      );
    });

    it("logs error via LoggingService on failure", async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValue(new Error("DB error"));
      service.start();
      await jest.advanceTimersByTimeAsync(1);
      expect(mockLoggingService.error).toHaveBeenCalledWith(
        "Background job failed",
        expect.objectContaining({ error: "DB error" }),
      );
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
      expect(true).toBe(true);
    });
  });

  describe("onModuleDestroy", () => {
    it("stops the interval on destroy", () => {
      const stopSpy = jest.spyOn(service, "stop");
      service.onModuleDestroy();
      expect(stopSpy).toHaveBeenCalled();
      stopSpy.mockRestore();
    });
  });
});
