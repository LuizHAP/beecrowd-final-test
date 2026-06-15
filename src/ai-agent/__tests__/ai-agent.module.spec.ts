import { AiAgentModule } from "../ai-agent.module";

describe("AiAgentModule", () => {
  it("is defined", () => {
    expect(AiAgentModule).toBeDefined();
  });

  it("is a class", () => {
    expect(typeof AiAgentModule).toBe("function");
  });
});
