import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";

export interface LLMIntentResult {
  intent: "CANCEL_ORDER" | "CHECK_STATUS" | "GENERAL_HELP" | "CREATE_ORDER";
  orderId?: string;
  shouldCallTool: boolean;
  toolName?: string;
  toolArgs?: Record<string, string>;
  confidence: number;
}

export interface LLMResponseResult {
  response: string;
  intent: LLMIntentResult;
  tokensUsed: number;
  responseTimeMs: number;
}

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private openai: OpenAI | null = null;
  private readonly model = "gpt-4o-mini";

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log("OpenAI client initialized");
    } else {
      this.logger.warn("OPENAI_API_KEY not set — LLM features disabled");
    }
  }

  isEnabled(): boolean {
    return this.openai !== null && process.env.LLM_MODE === "openai";
  }

  async classifyIntent(
    message: string,
    ragContext: string,
  ): Promise<LLMIntentResult> {
    if (!this.openai) {
      return { intent: "GENERAL_HELP", shouldCallTool: false, confidence: 0 };
    }

    const systemPrompt = `You are an AI assistant for an e-commerce order management system. Your job is to classify user messages into intents and decide if a tool call is needed.

Available intents:
- CANCEL_ORDER: User wants to cancel an order. Include orderId if provided.
- CHECK_STATUS: User wants to check the status of an order. Include orderId if provided.
- CREATE_ORDER: User wants to create a new order. Extract productId, quantity, and unitPrice.
- GENERAL_HELP: Everything else — general questions, greetings, account issues.

Knowledge base context:
${ragContext}

Rules:
- Only CANCEL_ORDER and CREATE_ORDER may need tool calls.
- CHECK_STATUS only needs to read data, no tool call.
- Always return valid JSON matching the schema below.
- If orderId is not mentioned, omit it.
- For CREATE_ORDER, extract productId (string), quantity (integer), unitPrice (number).

Return JSON:
{
  "intent": "CANCEL_ORDER" | "CHECK_STATUS" | "CREATE_ORDER" | "GENERAL_HELP",
  "orderId": "string or null",
  "shouldCallTool": boolean,
  "toolName": "string or null",
  "toolArgs": { "key": "value" } or null,
  "confidence": 0.0 to 1.0
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "intent_result",
            schema: {
              type: "object",
              properties: {
                intent: {
                  type: "string",
                  enum: [
                    "CANCEL_ORDER",
                    "CHECK_STATUS",
                    "CREATE_ORDER",
                    "GENERAL_HELP",
                  ],
                },
                orderId: { type: ["string", "null"] },
                shouldCallTool: { type: "boolean" },
                toolName: { type: ["string", "null"] },
                toolArgs: { type: ["object", "null"] },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["intent", "shouldCallTool", "confidence"],
              additionalProperties: false,
            },
          },
        },
        temperature: 0,
        max_tokens: 500,
      });

      const parsed = JSON.parse(completion.choices[0].message.content ?? "{}");
      return {
        intent: parsed.intent,
        orderId: parsed.orderId || undefined,
        shouldCallTool: parsed.shouldCallTool || false,
        toolName: parsed.toolName || undefined,
        toolArgs: parsed.toolArgs || undefined,
        confidence: parsed.confidence || 0,
      };
    } catch (error) {
      this.logger.error(`LLM classification failed: ${error}`);
      return { intent: "GENERAL_HELP", shouldCallTool: false, confidence: 0 };
    }
  }

  async generateResponse(
    intent: string,
    message: string,
    context: string,
    toolResult?: string,
  ): Promise<string> {
    if (!this.openai) {
      return "";
    }

    const systemPrompt = `You are a helpful AI support agent for an e-commerce platform. Answer user questions based on the knowledge base context.

Knowledge base context:
${context}

Rules:
- Be concise and helpful.
- If a tool was called (toolResult provided), include the result in your response.
- Never expose internal system details or error messages.
- If you don't know something, say so politely.`;

    let userMessage = message;
    if (toolResult) {
      userMessage = `${message}\n\nTool result: ${toolResult}`;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return completion.choices[0].message.content || "";
    } catch (error) {
      this.logger.error(`LLM response generation failed: ${error}`);
      return "I apologize, but I encountered an issue processing your request.";
    }
  }
}
