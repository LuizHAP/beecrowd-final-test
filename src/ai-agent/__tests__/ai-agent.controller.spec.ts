import { BadRequestException } from "@nestjs/common";
import { AiAgentController } from "../ai-agent.controller";

describe("AiAgentController", () => {
  let controller: AiAgentController;
  let mockService: any;

  beforeEach(() => {
    mockService = {
      process: jest.fn(),
      getLogs: jest.fn(),
    };
    controller = new AiAgentController(mockService);
  });

  describe("chat", () => {
    it("throws when message is empty", async () => {
      await expect(controller.chat({ message: "" as any })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws when message is not a string", async () => {
      await expect(controller.chat({ message: 123 as any })).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws when message is undefined", async () => {
      await expect(controller.chat({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("delegates to aiService.process with message only", async () => {
      const mockResult = {
        response: "Hello!",
        log: { intent: "GENERAL_HELP" },
      };
      mockService.process.mockResolvedValue(mockResult);

      const result = await controller.chat({ message: "Hello" });

      expect(mockService.process).toHaveBeenCalledWith("Hello", undefined);
      expect(result).toEqual(mockResult);
    });

    it("delegates to aiService.process with message and orderId", async () => {
      const mockResult = {
        response: "Order status: PENDING",
        log: { intent: "CHECK_STATUS" },
      };
      mockService.process.mockResolvedValue(mockResult);

      const result = await controller.chat({
        message: "Status?",
        orderId: "order-1",
      });

      expect(mockService.process).toHaveBeenCalledWith("Status?", "order-1");
      expect(result).toEqual(mockResult);
    });
  });

  describe("getLogs", () => {
    it("returns logs with default limit", async () => {
      const mockLogs = [{ id: "log-1", intent: "GENERAL_HELP" }];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs();

      expect(mockService.getLogs).toHaveBeenCalledWith(
        50,
        undefined,
        undefined,
      );
      expect(result).toEqual({ logs: mockLogs });
    });

    it("returns logs with custom limit", async () => {
      const mockLogs = [{ id: "log-1", intent: "GENERAL_HELP" }];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs("10");

      expect(mockService.getLogs).toHaveBeenCalledWith(
        10,
        undefined,
        undefined,
      );
      expect(result).toEqual({ logs: mockLogs });
    });

    it("filters by intent", async () => {
      mockService.getLogs.mockResolvedValue([]);

      await controller.getLogs(undefined, "CANCEL_ORDER");

      expect(mockService.getLogs).toHaveBeenCalledWith(
        50,
        "CANCEL_ORDER",
        undefined,
      );
    });

    it("filters by injection true", async () => {
      mockService.getLogs.mockResolvedValue([]);

      await controller.getLogs(undefined, undefined, "true");

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, true);
    });

    it("filters by injection false", async () => {
      mockService.getLogs.mockResolvedValue([]);

      await controller.getLogs(undefined, undefined, "false");

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, false);
    });

    it("throws for invalid limit (non-numeric)", async () => {
      await expect(controller.getLogs("abc")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws for negative limit", async () => {
      await expect(controller.getLogs("-5")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws for zero limit", async () => {
      await expect(controller.getLogs("0")).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
