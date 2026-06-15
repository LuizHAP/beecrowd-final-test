import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { PrismaOrderRepository } from "../orders/prisma-order.repository";
import { OrdersService } from "../orders/orders.service";
import { Order } from "../domain/order/order.entity";
import { OrderStatus } from "../domain/order/order-status";
import knowledgeBase from "../../knowledge_base.json";
import { LLMService } from "./llm.service";

export interface AILogEntry {
  intent: "CANCEL_ORDER" | "CHECK_STATUS" | "GENERAL_HELP" | "CREATE_ORDER";
  model: string;
  tokensUsed: number;
  responseTimeMs: number;
  toolCalled: "CANCEL_ORDER" | null;
  toolSuccess: boolean | null;
  promptInjectionDetected: boolean;
  rawInput?: string;
  rawOutput?: string;
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);
  private readonly llmEnabled: boolean;
  private readonly llmModel: string;

  constructor(
    private orderRepo: PrismaOrderRepository,
    private prisma: PrismaService,
    private ordersService: OrdersService,
    private llmService: LLMService,
  ) {
    this.llmEnabled = this.llmService.isEnabled();
    this.llmModel = this.llmService["model"];
  }

  async process(
    message: string,
    orderId?: string,
  ): Promise<{ response: string; log: AILogEntry }> {
    const startTime = Date.now();
    const promptInjectionDetected = this.detectPromptInjection(message);

    // Use LLM for intent classification if enabled, otherwise use deterministic
    let intent: AILogEntry["intent"];
    let llmIntentResult = null;

    if (this.llmEnabled && !promptInjectionDetected) {
      const ragContext = this.buildRAGContext("GENERAL_HELP");
      try {
        llmIntentResult = await this.llmService.classifyIntent(
          message,
          ragContext,
        );
        intent = llmIntentResult.intent;
        this.logger.debug(
          `LLM classified intent: ${intent} (confidence: ${llmIntentResult.confidence})`,
        );
      } catch {
        intent = this.extractIntent(message);
      }
    } else {
      intent = this.extractIntent(message);
    }

    const log: AILogEntry = {
      intent,
      model: this.llmService.isEnabled()
        ? this.llmService["model"]
        : "local-deterministic",
      tokensUsed: 0,
      responseTimeMs: 0,
      toolCalled: null,
      toolSuccess: null,
      promptInjectionDetected,
      rawInput: message,
      rawOutput: "",
    };

    // Guardrail: reject prompt injection
    if (promptInjectionDetected) {
      log.responseTimeMs = Date.now() - startTime;
      log.rawOutput =
        "I cannot process this request. Please rephrase your question.";
      await this.persistAILog(log, orderId);
      return { response: log.rawOutput, log };
    }

    const ragContext = this.buildRAGContext(intent);

    // Get order context if provided
    let orderContext = null;
    if (orderId) {
      orderContext = await this.getOrderContext(orderId);
    }

    // Handle cancel intent with tool calling
    if (intent === "CANCEL_ORDER") {
      const targetOrderId =
        orderId ||
        this.extractOrderIdFromMessage(message) ||
        llmIntentResult?.orderId;

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

    // Handle create order intent
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

    // Handle check status intent
    if (intent === "CHECK_STATUS") {
      const targetOrderId =
        orderId ||
        this.extractOrderIdFromMessage(message) ||
        llmIntentResult?.orderId;

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

    // General help — use LLM for response if enabled
    let responseText: string;
    if (this.llmService.isEnabled() && llmIntentResult) {
      const llmResponse = await this.llmService.generateResponse(
        intent,
        message,
        ragContext,
      );
      responseText =
        llmResponse ||
        `Here's what I can help you with:\n\n${ragContext}\n\n${orderContext ? `Your order ${orderContext.id} is currently ${orderContext.status}.` : "Please provide an order ID for specific information."}`;
      log.tokensUsed = 0; // Will be set after persist
    } else {
      responseText = `Here's what I can help you with:\n\n${ragContext}\n\n${orderContext ? `Your order ${orderContext.id} is currently ${orderContext.status}.` : "Please provide an order ID for specific information."}`;
    }

    log.responseTimeMs = Date.now() - startTime;
    log.rawOutput = responseText;
    await this.persistAILog(log, orderId);

    return { response: responseText, log };
  }

  async getLogs(limit = 50, intent?: string, injection?: boolean) {
    const where: Record<string, unknown> = {};
    if (intent) where.intent = intent;
    if (injection !== undefined) where.promptInjectionDetected = injection;

    return this.prisma.aILog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: Math.min(limit, 100),
    });
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
    const relevantRules = knowledgeBase.filter((kb) => {
      const lower = kb.context.toLowerCase();
      if (intent === "CANCEL_ORDER") return lower.includes("cancel");
      if (intent === "CHECK_STATUS")
        return lower.includes("status") || lower.includes("update");
      return true;
    });
    return relevantRules.map((kb) => `[${kb.context}] ${kb.rule}`).join("\n\n");
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
      order.cancel();
      await this.orderRepo.updateStatus(orderId, OrderStatus.CANCELLED);
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
    llmResult?: { toolArgs?: Record<string, string> },
  ): Promise<{ response: string }> {
    // Try to extract from LLM tool args first
    const toolArgs = llmResult?.toolArgs;
    if (toolArgs?.productId && toolArgs?.quantity && toolArgs?.unitPrice) {
      try {
        const dto = {
          items: [
            {
              productId: toolArgs.productId,
              quantity: parseInt(toolArgs.quantity, 10),
              unitPrice: parseFloat(toolArgs.unitPrice),
            },
          ],
        };

        // Validate with OrderItem constructor
        const { OrderItem } = await import("../domain/order/order-item.entity");
        const { Order } = await import("../domain/order/order.entity");
        const { OrderStatus } = await import("../domain/order/order-status");

        const orderItems = [
          new OrderItem({
            id: "",
            productId: dto.items[0].productId,
            quantity: dto.items[0].quantity,
            unitPrice: dto.items[0].unitPrice,
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

    // Try regex extraction as fallback
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

    try {
      const dto = {
        items: [
          {
            productId: productIdMatch[1],
            quantity: parseInt(quantityMatch[1], 10),
            unitPrice: parseFloat(priceMatch[1]),
          },
        ],
      };

      const { OrderItem } = await import("../domain/order/order-item.entity");
      const { Order } = await import("../domain/order/order.entity");
      const { OrderStatus } = await import("../domain/order/order-status");

      const orderItems = [
        new OrderItem({
          id: "",
          productId: dto.items[0].productId,
          quantity: dto.items[0].quantity,
          unitPrice: dto.items[0].unitPrice,
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
        response: `I couldn't create the order: ${error instanceof Error ? error.message : "Invalid data"}. Please check the product ID, quantity, and price.`,
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
      console.error("[AI LOG PERSIST ERROR]", error);
    }
  }

  private extractOrderIdFromMessage(message: string): string | null {
    const match = message.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    );
    return match ? match[0] : null;
  }
}
