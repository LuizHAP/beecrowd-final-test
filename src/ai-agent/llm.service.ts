import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { LoggingService } from "../common/logging/logging.service";

export interface IntentClassification {
  intent: "CANCEL_ORDER" | "CHECK_STATUS" | "GENERAL_HELP" | "CREATE_ORDER";
  shouldCallTool: boolean;
  confidence: number;
  toolArgs?: {
    productId: string;
    quantity: string;
    unitPrice: string;
  } & Record<string, string>;
}

@Injectable()
export class LLMService {
  private client: OpenAI | null = null;
  private logger: LoggingService;

  constructor(loggingService: LoggingService) {
    this.logger = loggingService.child("LLM");
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async classifyIntent(message: string): Promise<IntentClassification> {
    if (!this.client) {
      return { intent: "GENERAL_HELP", shouldCallTool: false, confidence: 0 };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an intent classifier for an e-commerce support agent. " +
              "Classify the user message into one of these intents: " +
              "CANCEL_ORDER, CHECK_STATUS, GENERAL_HELP, CREATE_ORDER. " +
              "Respond with a JSON object containing: intent, shouldCallTool (boolean), " +
              "confidence (0-1), and toolArgs (object with productId, quantity, unitPrice if CREATE_ORDER).",
          },
          { role: "user", content: message },
        ],
        temperature: 0,
        max_tokens: 200,
      });

      const text = response.choices[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(text);

      return {
        intent: parsed.intent ?? "GENERAL_HELP",
        shouldCallTool: parsed.shouldCallTool ?? false,
        confidence: parsed.confidence ?? 0,
        toolArgs: parsed.toolArgs,
      };
    } catch (error) {
      this.logger.error("LLM classification failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return { intent: "GENERAL_HELP", shouldCallTool: false, confidence: 0 };
    }
  }

  async generateResponse(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    if (!this.client) {
      return "I'm sorry, I can only help with order-related questions.";
    }

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content ?? "No response generated.";
    } catch (error) {
      this.logger.error("LLM response generation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return "I'm sorry, I can only help with order-related questions.";
    }
  }
}
