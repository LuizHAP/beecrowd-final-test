import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { LoggingService } from "../common/logging/logging.service";
import { PrismaOrderRepository } from "../orders/prisma-order.repository";
import { Order } from "../domain/order/order.entity";
import { OrderItem } from "../domain/order/order-item.entity";
import { OrderStatus } from "../domain/order/order-status";
import knowledgeBase from "../../knowledge_base.json";
import { LLMService, IntentClassification } from "./llm.service";

export interface AILogEntry {
  id: string;
  orderId: string | null;
  intent: "CANCEL_ORDER" | "CHECK_STATUS" | "GENERAL_HELP" | "CREATE_ORDER";
  model: string;
  tokensUsed: number;
  responseTimeMs: number;
  toolCalled: "CANCEL_ORDER" | null;
  toolSuccess: boolean | null;
  promptInjectionDetected: boolean;
  rawInput: string | null;
  rawOutput: string | null;
  timestamp: Date;
}

@Injectable()
export class AiAgentService {
  private logger: LoggingService;

  constructor(
    private orderRepo: PrismaOrderRepository,
    private prisma: PrismaService,
    private llmService: LLMService,
    loggingService: LoggingService,
  ) {
    this.logger = loggingService.child("AiAgent");
  }

  async process(
    message: string,
    orderId?: string,
  ): Promise<{ response: string; log: AILogEntry }> {
    const startTime = Date.now();
    const promptInjectionDetected = this.detectPromptInjection(message);

    let intent: AILogEntry["intent"];
    let llmIntentResult: IntentClassification | null = null;

    if (this.llmService.isEnabled() && !promptInjectionDetected) {
      try {
        llmIntentResult = await this.llmService.classifyIntent(message);
        intent = llmIntentResult.intent;
        this.logger.debug("LLM classified intent", {
          intent,
          confidence: llmIntentResult.confidence,
        });
      } catch {
        intent = this.extractIntent(message);
      }
    } else {
      intent = this.extractIntent(message);
    }

    const log: AILogEntry = {
      id: "",
      orderId: null,
      intent,
      model: this.llmService.isEnabled()
        ? "gpt-4o-mini"
        : "local-deterministic",
      tokensUsed: 0,
      responseTimeMs: 0,
      toolCalled: null,
      toolSuccess: null,
      promptInjectionDetected,
      rawInput: message,
      rawOutput: null,
      timestamp: new Date(),
    };

    if (promptInjectionDetected) {
      log.responseTimeMs = Date.now() - startTime;
      log.rawOutput =
        "I cannot process this request. Please rephrase your question.";
      await this.persistAILog(log, orderId);
      return { response: log.rawOutput, log };
    }

    const ragContext = this.buildRAGContext(intent);

    let orderContext: Order | null = null;
    if (orderId) {
      orderContext = await this.getOrderContext(orderId);
    }

    if (intent === "CANCEL_ORDER") {
      const targetOrderId =
        orderId ||
        this.extractOrderIdFromMessage(message) ||
        llmIntentResult?.toolArgs?.orderId;

      if (!targetOrderId) {
        log.responseTimeMs = Date.now() - startTime;
        log.rawOutput = "Please provide the order ID you want to cancel.";
        await this.persistAILog(log, orderId);
        return { response: log.rawOutput, log };
      }

      log.toolCalled = "CANCEL_ORDER";
      const result = await this.cancelOrder(targetOrderId);
      log.toolSuccess = result.success;
      log.rawOutput = result.message;
      log.responseTimeMs = Date.now() - startTime;
      await this.persistAILog(log, targetOrderId);

      return { response: result.message, log };
    }

    if (intent === "CREATE_ORDER") {
      const createResult = await this.handleCreateOrder(
        message,
        llmIntentResult ?? undefined,
      );
      log.responseTimeMs = Date.now() - startTime;
      log.rawOutput = createResult.response;
      await this.persistAILog(log, orderId);
      return { response: createResult.response, log };
    }

    if (intent === "CHECK_STATUS") {
      const targetOrderId =
        orderId ||
        this.extractOrderIdFromMessage(message) ||
        llmIntentResult?.toolArgs?.orderId;

      if (!targetOrderId) {
        log.responseTimeMs = Date.now() - startTime;
        log.rawOutput = "Please provide the order ID you want to check.";
        await this.persistAILog(log, orderId);
        return { response: log.rawOutput, log };
      }

      const order = await this.getOrderContext(targetOrderId);
      log.responseTimeMs = Date.now() - startTime;
      await this.persistAILog(log, targetOrderId);

      if (!order) {
        return { response: `Order ${targetOrderId} not found.`, log };
      }

      return {
        response: `Order ${order.id} is currently ${order.status}. Created on ${new Date(order.createdAt).toLocaleDateString()}.`,
        log,
      };
    }

    let responseText: string;
    if (this.llmService.isEnabled() && llmIntentResult) {
      const llmResponse = await this.llmService.generateResponse(
        ragContext,
        message,
      );
      responseText =
        llmResponse ||
        `Here's what I can help you with:\n\n${ragContext}\n\n${orderContext ? `Your order ${orderContext.id} is currently ${orderContext.status}.` : "Please provide an order ID for specific information."}`;
    } else {
      responseText = `Here's what I can help you with:\n\n${ragContext}\n\n${orderContext ? `Your order ${orderContext.id} is currently ${orderContext.status}.` : "Please provide an order ID for specific information."}`;
    }

    log.responseTimeMs = Date.now() - startTime;
    log.rawOutput = responseText;
    await this.persistAILog(log, orderId);

    return { response: responseText, log };
  }

  async getLogs(
    limit = 50,
    intent?: string,
    injection?: boolean,
  ): Promise<AILogEntry[]> {
    const where: {
      intent?: AILogEntry["intent"];
      promptInjectionDetected?: boolean;
    } = {};
    if (intent) where.intent = intent as AILogEntry["intent"];
    if (injection !== undefined) where.promptInjectionDetected = injection;

    const logs = await this.prisma.aILog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 100),
    });

    return logs.map((log) => ({
      id: log.id,
      orderId: log.orderId,
      intent: log.intent as AILogEntry["intent"],
      model: log.model,
      tokensUsed: log.tokensUsed,
      responseTimeMs: log.responseTimeMs,
      toolCalled: log.toolCalled as AILogEntry["toolCalled"],
      toolSuccess: log.toolSuccess,
      promptInjectionDetected: log.promptInjectionDetected,
      rawInput: log.rawInput,
      rawOutput: log.rawOutput,
      timestamp: log.timestamp,
    }));
  }

  private detectPromptInjection(message: string): boolean {
    const patterns = [
      /ignore all previous instructions/i,
      /you are now/i,
      /system prompt/i,
      /bypass the rules/i,
      /forget everything/i,
      /act as if/i,
      /do not follow/i,
      /disregard/i,
    ];
    return patterns.some((p) => p.test(message));
  }

  private extractIntent(message: string): AILogEntry["intent"] {
    const lower = message.toLowerCase();
    if (/cancel|refund|return|stop|undo/i.test(lower)) return "CANCEL_ORDER";
    if (/status|track|where is|what happened/i.test(lower))
      return "CHECK_STATUS";
    if (/help|support|question|info/i.test(lower)) return "GENERAL_HELP";
    if (/order|create|buy|purchase/i.test(lower)) return "CREATE_ORDER";
    return "GENERAL_HELP";
  }

  private buildRAGContext(intent: string): string {
    const relevantRules = knowledgeBase.filter((kb: { context: string }) => {
      const lower = kb.context.toLowerCase();
      if (intent === "CANCEL_ORDER") return lower.includes("cancel");
      if (intent === "CHECK_STATUS")
        return lower.includes("status") || lower.includes("update");
      return true;
    });
    return relevantRules
      .map(
        (kb: { context: string; rule: string }) => `[${kb.context}] ${kb.rule}`,
      )
      .join("\n\n");
  }

  private async getOrderContext(orderId: string): Promise<Order | null> {
    try {
      return await this.orderRepo.findById(orderId);
    } catch {
      return null;
    }
  }

  private async cancelOrder(
    orderId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.orderRepo.findById(orderId);
      if (!order)
        return { success: false, message: `Order ${orderId} not found.` };
      if (!order.canCancel()) {
        return {
          success: false,
          message: `Order ${orderId} cannot be cancelled. Current status: ${order.status}.`,
        };
      }
      const updated = await this.orderRepo.updateStatusIfPending(
        orderId,
        OrderStatus.CANCELLED,
      );
      if (!updated) {
        return {
          success: false,
          message: `Order ${orderId} cannot be cancelled. Status changed to ${order.status} while processing.`,
        };
      }
      return {
        success: true,
        message: `Order ${orderId} has been successfully cancelled.`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error cancelling order: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  private async handleCreateOrder(
    message: string,
    llmResult?: IntentClassification,
  ): Promise<{ response: string }> {
    const toolArgs = llmResult?.toolArgs as
      | { productId: string; quantity: string; unitPrice: string }
      | undefined;
    if (toolArgs?.productId && toolArgs?.quantity && toolArgs?.unitPrice) {
      return this.createFromArgs(toolArgs);
    }

    const productIdMatch = message.match(
      /(?:product|item|sku)[s]?\s*[:\s]*([A-Za-z0-9_-]+)/i,
    );
    const quantityMatch = message.match(
      /(?:quantity|qty|amount|number)[s]?\s*[:\s]*(\d+)/i,
    );
    const priceMatch = message.match(/(?:price|cost|at|for)\s*\$?(\d+\.?\d*)/i);

    if (!productIdMatch || !quantityMatch || !priceMatch) {
      return {
        response:
          "I'd be happy to help you create an order! Please provide:\n- Product ID\n- Quantity\n- Unit price\n\nExample: 'Create an order for product ABC-123, quantity 2, at $10 each'",
      };
    }

    const prodId = productIdMatch![1] as string;
    const qty = quantityMatch![1] as string;
    const price = priceMatch![1] as string;
    return this.createFromArgs({
      productId: prodId,
      quantity: qty,
      unitPrice: price,
    });
  }

  private async createFromArgs(args: {
    productId: string;
    quantity: string;
    unitPrice: string;
  }): Promise<{ response: string }> {
    try {
      const quantity = parseInt(args.quantity, 10);
      const unitPrice = parseFloat(args.unitPrice);
      if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) {
        throw new Error("Invalid quantity or price");
      }
      const dto = {
        items: [
          {
            productId: args.productId,
            quantity,
            unitPrice,
          },
        ],
      };

      const orderItems = [
        new OrderItem({
          id: "",
          productId: dto.items[0]!.productId,
          quantity: dto.items[0]!.quantity,
          unitPrice: dto.items[0]!.unitPrice,
        }),
      ];

      const order = new Order({
        id: "",
        status: OrderStatus.PENDING,
        items: orderItems,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const created = await this.orderRepo.create(order);
      const total = created.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      return {
        response: `Order created successfully!\n\nOrder ID: ${created.id}\nStatus: PENDING\nTotal: $${total.toFixed(2)}\n\nYour order will be automatically processed within 5 minutes.`,
      };
    } catch (error) {
      return {
        response: `I couldn't create the order: ${error instanceof Error ? error.message : "Invalid data"}. Please provide a valid product ID, quantity, and price.`,
      };
    }
  }

  private async persistAILog(log: AILogEntry, orderId?: string): Promise<void> {
    try {
      await this.prisma.aILog.create({
        data: {
          orderId,
          intent: log.intent,
          model: log.model,
          tokensUsed: log.tokensUsed,
          responseTimeMs: log.responseTimeMs,
          toolCalled: log.toolCalled,
          toolSuccess: log.toolSuccess,
          promptInjectionDetected: log.promptInjectionDetected,
          rawInput: log.rawInput,
          rawOutput: log.rawOutput,
        },
      });
    } catch (error) {
      this.logger.error("AI log persistence failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private extractOrderIdFromMessage(message: string): string | null {
    const match = message.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    return match ? match[0] : null;
  }
}
