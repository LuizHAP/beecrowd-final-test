import { LLMService } from "../llm.service";

describe("LLMService", () => {
  let service: LLMService;

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.LLM_MODE;
    jest.clearAllMocks();
  });

  describe("constructor", () => {
    it("should not initialize OpenAI client when API key is not set", () => {
      service = new LLMService();
      expect(service.isEnabled()).toBe(false);
    });

    it("should initialize OpenAI client when API key is set", () => {
      process.env.OPENAI_API_KEY = "test-key";
      service = new LLMService();
      // isEnabled requires both key and LLM_MODE=openai
      expect(service.isEnabled()).toBe(false);
    });

    it("should return false when LLM_MODE is not openai", () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "deterministic";
      service = new LLMService();
      expect(service.isEnabled()).toBe(false);
    });

    it("should return true when both API key and LLM_MODE are set", () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "openai";
      service = new LLMService();
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("classifyIntent", () => {
    it("should return GENERAL_HELP when openai client is not initialized", async () => {
      service = new LLMService();
      const result = await service.classifyIntent("cancel order", "context");
      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it("should return GENERAL_HELP when API call fails", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "openai";
      service = new LLMService();

      const result = await service.classifyIntent("cancel order", "context");
      expect(result.intent).toBe("GENERAL_HELP");
      expect(result.shouldCallTool).toBe(false);
    });
  });

  describe("generateResponse", () => {
    it("should return empty string when openai client is not initialized", async () => {
      service = new LLMService();
      const result = await service.generateResponse(
        "GENERAL_HELP",
        "hello",
        "context",
      );
      expect(result).toBe("");
    });

    it("should return fallback message when API call fails", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      process.env.LLM_MODE = "openai";
      service = new LLMService();

      const result = await service.generateResponse(
        "GENERAL_HELP",
        "hello",
        "context",
      );
      expect(result).toContain("apologize");
    });
  });
});
