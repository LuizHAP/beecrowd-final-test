import type { LoggingService } from "../../common/logging/logging.service";

const fallbackMockState: { content: string | null; fail: boolean } = {
  content: "Test response",
  fail: false,
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
            if (fallbackMockState.fail)
              return Promise.reject(new Error("API error"));
            return Promise.resolve({
              choices: [{ message: { content: fallbackMockState.content } }],
            });
          }),
        },
      };
    }
  },
}));

const fallbackMockLoggingService = {
  child: jest.fn().mockReturnThis(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  log: jest.fn(),
} as unknown as LoggingService;

describe("LLMService fallback paths", () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_MODE;
    jest.clearAllMocks();
    fallbackMockState.content = "Test response";
    fallbackMockState.fail = false;
  });

  it("should use ?? fallback when content is null in classifyIntent", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LLM_MODE = "openai";
    fallbackMockState.content = null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LLMService } = require("../llm.service");
    const svc = new LLMService(fallbackMockLoggingService);

    const result = await svc.classifyIntent("cancel order");
    expect(result.intent).toBe("GENERAL_HELP");
    expect(result.shouldCallTool).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("should use || fallback when content is null in generateResponse", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LLM_MODE = "openai";
    fallbackMockState.content = null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LLMService } = require("../llm.service");
    const svc = new LLMService(fallbackMockLoggingService);

    const result = await svc.generateResponse("test", "context");
    expect(result).toBe("No response generated.");
  });

  it("should handle API errors in classifyIntent", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LLM_MODE = "openai";
    fallbackMockState.fail = true;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LLMService } = require("../llm.service");
    const svc = new LLMService(fallbackMockLoggingService);

    const result = await svc.classifyIntent("cancel order");
    expect(result.intent).toBe("GENERAL_HELP");
    expect(result.shouldCallTool).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("should handle API errors in generateResponse", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LLM_MODE = "openai";
    fallbackMockState.fail = true;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LLMService } = require("../llm.service");
    const svc = new LLMService(fallbackMockLoggingService);

    const result = await svc.generateResponse("test", "context");
    expect(result).toBe(
      "I'm sorry, I can only help with order-related questions.",
    );
  });
});
