import { LLMService } from "../llm.service";
import type { LoggingService } from "../../common/logging/logging.service";

const mockState: {
  content: string | null;
  fail: boolean;
  failWithString: boolean;
} = {
  content: "Test response",
  fail: false,
  failWithString: false,
};

jest.mock("openai", () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat: {
      completions: {
        create: jest.Mock;
      };
    };
    constructor() {
      this.chat = {
        completions: {
          create: jest.fn().mockImplementation(() => {
            if (mockState.failWithString) return Promise.reject("string error");
            if (mockState.fail) return Promise.reject(new Error("API error"));
            return Promise.resolve({
              choices: [{ message: { content: mockState.content } }],
            });
          }),
        },
      };
    }
  },
}));

const mockLoggingService = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
} as unknown as LoggingService;

describe("LLMService", () => {
  let service: LLMService;

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_MODE;
    jest.clearAllMocks();
    mockState.content = "Test response";
    mockState.fail = false;
    mockState.failWithString = false;
  });

  describe("constructor", () => {
    it("should not initialize OpenAI client when API key is not set", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      expect(service.isEnabled()).toBe(false);
    });

    it("should initialize OpenAI client when API key is set", () => {
      process.env.OPENAI_API_KEY = "test-key";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("classifyIntent", () => {
    it("should return default intent when LLM is not enabled", async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.classifyIntent("test message");
      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("should parse LLM response correctly", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.content = JSON.stringify({
        intent: "CANCEL_ORDER",
        shouldCallTool: true,
        confidence: 0.95,
      });

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.classifyIntent("cancel my order");

      expect(result.intent).toBe("CANCEL_ORDER");
      expect(result.shouldCallTool).toBe(true);
      expect(result.confidence).toBe(0.95);
    });

    it("should handle null content from LLM", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.content = null;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.classifyIntent("test");

      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("should handle invalid JSON response", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.content = "not json";

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.classifyIntent("test");

      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("should handle API errors gracefully", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.fail = true;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.classifyIntent("test");

      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("should handle string errors gracefully", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.failWithString = true;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.classifyIntent("test");

      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe("generateResponse", () => {
    it("should return fallback string when LLM is not enabled", async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.generateResponse("test message", "context");
      expect(result).toBe(
        "I'm sorry, I can only help with order-related questions.",
      );
    });

    it("should return LLM response when enabled", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.content = "Your order has been cancelled";

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.generateResponse("cancel order", "context");

      expect(result).toBe("Your order has been cancelled");
    });

    it("should handle API errors gracefully", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.fail = true;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.generateResponse("test", "context");

      expect(result).toBe(
        "I'm sorry, I can only help with order-related questions.",
      );
    });

    it("should handle string errors gracefully", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      mockState.failWithString = true;

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService);
      const result = await service.generateResponse("test", "context");

      expect(result).toBe(
        "I'm sorry, I can only help with order-related questions.",
      );
    });
  });
});
