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
    chat: any;
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
};

describe("LLMService", () => {
  let service: any;

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
      service = new LLMService(mockLoggingService as any);
      expect(service.isEnabled()).toBe(false);
    });

    it("should initialize OpenAI client when API key is set", () => {
      process.env.OPENAI_API_KEY = "test-key";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService as any);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("classifyIntent", () => {
    it("should return GENERAL_HELP when client is not initialized", async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService as any);
      const result = await service.classifyIntent("cancel order");
      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("should return GENERAL_HELP when API call fails with Error", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "openai";
      mockState.fail = true;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService as any);
      const result = await service.classifyIntent("cancel order");
      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
    });

    it("should handle non-Error rejection in classifyIntent", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "openai";
      mockState.failWithString = true;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService as any);
      const result = await service.classifyIntent("test");
      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
    });
  });

  describe("generateResponse", () => {
    it("should return fallback when client is not initialized", async () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService as any);
      const result = await service.generateResponse("GENERAL_HELP", "hello");
      expect(result).toContain("sorry");
    });

    it("should return fallback message when API call fails with Error", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "openai";
      mockState.fail = true;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService as any);
      const result = await service.generateResponse("GENERAL_HELP", "hello");
      expect(result).toContain("sorry");
    });

    it("should handle non-Error rejection in generateResponse", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "openai";
      mockState.failWithString = true;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { LLMService } = require("../llm.service");
      service = new LLMService(mockLoggingService as any);
      const result = await service.generateResponse("test", "test");
      expect(result).toContain("sorry");
    });
  });
});
