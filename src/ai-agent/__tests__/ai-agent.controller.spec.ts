import { BadRequestException } from "@nestjs/common";
import { AiAgentController } from "../ai-agent.controller";
import type { AiAgentService, AILogEntry } from "../ai-agent.service";

interface ChatBody {
  message: string;
  orderId?: string;
}

describe("AiAgentController", () => {
  let controller: AiAgentController;
  let mockService: jest.MockedObjectDeep<AiAgentService>;

  beforeEach(() => {
    mockService = {
      process: jest.fn(),
      getLogs: jest.fn(),
    } as unknown as jest.MockedObjectDeep<AiAgentService>;
    controller = new AiAgentController(mockService);
  });

  describe("chat", () => {
    it("throws when message is empty", async () => {
      await expect(
        controller.chat({ message: "" } as unknown as ChatBody),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws when message is not a string", async () => {
      await expect(
        controller.chat({
          message: 123,
          orderId: undefined,
        } as unknown as ChatBody),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws when message is undefined", async () => {
      await expect(controller.chat({} as unknown as ChatBody)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("delegates to aiService.process with message only", async () => {
      const mockResult = {
        response: "Hello!",
        log: {
          intent: "GENERAL_HELP",
          model: "test",
          tokensUsed: 0,
          responseTimeMs: 0,
          toolCalled: null,
          toolSuccess: null,
          promptInjectionDetected: false,
        } as AILogEntry,
      };
      mockService.process.mockResolvedValue(mockResult);

      const result = await controller.chat({ message: "Hello" });

      expect(mockService.process).toHaveBeenCalledWith("Hello", undefined);
      expect(result).toEqual(mockResult);
    });

    it("delegates to aiService.process with message and orderId", async () => {
      const mockResult = {
        response: "Order status: PENDING",
        log: {
          intent: "CHECK_STATUS",
          model: "test",
          tokensUsed: 0,
          responseTimeMs: 0,
          toolCalled: null,
          toolSuccess: null,
          promptInjectionDetected: false,
        } as AILogEntry,
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
      const mockLogs: AILogEntry[] = [
        {
          intent: "GENERAL_HELP",
          model: "test",
          tokensUsed: 0,
          responseTimeMs: 0,
          toolCalled: null,
          toolSuccess: null,
          promptInjectionDetected: false,
          id: "log-1",
          orderId: null,
          timestamp: new Date(),
          rawInput: "test",
          rawOutput: null,
        },
      ];
      mockService.getLogs.mockResolvedValue(mockLogs);

      const result = await controller.getLogs();

      expect(mockService.getLogs).toHaveBeenCalledWith(
        50,
        undefined,
        undefined,
      );
      expect(result).toEqual({ logs: mockLogs });
    });

    it("returns logs with specified limit", async () => {
      const mockLogs: AILogEntry[] = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      await controller.getLogs("10");

      expect(mockService.getLogs).toHaveBeenCalledWith(
        10,
        undefined,
        undefined,
      );
    });

    it("throws when limit is invalid", async () => {
      await expect(controller.getLogs("0")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws when limit is not a number", async () => {
      await expect(controller.getLogs("abc")).rejects.toThrow(
        BadRequestException,
      );
    });

    it("caps limit at 100", async () => {
      const mockLogs: AILogEntry[] = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      await controller.getLogs("200");

      expect(mockService.getLogs).toHaveBeenCalledWith(
        100,
        undefined,
        undefined,
      );
    });

    it("filters by intent", async () => {
      const mockLogs: AILogEntry[] = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      await controller.getLogs(undefined, "CANCEL_ORDER");

      expect(mockService.getLogs).toHaveBeenCalledWith(
        50,
        "CANCEL_ORDER",
        undefined,
      );
    });

    it("filters by injection=true", async () => {
      const mockLogs: AILogEntry[] = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      await controller.getLogs(undefined, undefined, "true");

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, true);
    });

    it("filters by injection=false", async () => {
      const mockLogs: AILogEntry[] = [];
      mockService.getLogs.mockResolvedValue(mockLogs);

      await controller.getLogs(undefined, undefined, "false");

      expect(mockService.getLogs).toHaveBeenCalledWith(50, undefined, false);
    });
  });
});
