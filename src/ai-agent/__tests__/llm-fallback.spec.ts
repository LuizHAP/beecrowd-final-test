// Isolated test file for LLM fallback paths that require mocking OpenAI.
// Uses a mutable mockState object so tests can control the mock behavior.

const mockState: { content: string | null; fail: boolean } = {
  content: "Test response",
  fail: false,
};

jest.mock("openai", () => ({
  __esModule: true,
  default: class MockOpenAI {
    chat: any;
    constructor() {
      this.chat = {
        completions: {
          create: jest.fn().mockImplementation(() => {
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

describe("LLMService fallback paths", () => {
  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_MODE;
    jest.clearAllMocks();
    mockState.content = "Test response";
    mockState.fail = false;
  });

  it("should use ?? fallback when content is null in classifyIntent", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LLM_MODE = "openai";
    mockState.content = null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LLMService } = require("../llm.service");
    const svc = new LLMService();

    const result = await svc.classifyIntent("cancel order", "context");
    expect(result.intent).toBe(undefined);
    expect(result.shouldCallTool).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("should use || fallback when content is null in generateResponse", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LLM_MODE = "openai";
    mockState.content = null;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LLMService } = require("../llm.service");
    const svc = new LLMService();

    const result = await svc.generateResponse(
      "GENERAL_HELP",
      "hello",
      "context",
    );
    expect(result).toBe("");
  });

  it("should include toolResult in user message when provided", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.LLM_MODE = "openai";

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { LLMService } = require("../llm.service");
    const svc = new LLMService();

    const result = await svc.generateResponse(
      "GENERAL_HELP",
      "Here is the status",
      "context",
      "Order is PENDING",
    );
    expect(result).toBe("Test response");
  });
});
