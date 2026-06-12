import { prisma } from './prisma';
import knowledgeBase from '../../knowledge_base.json';
import type { AILogEntry } from './types';

// Prompt injection detection
export function detectPromptInjection(message: string): boolean {
  const injectionPatterns = [
    /ignore all previous instructions/i,
    /you are now/i,
    /system prompt/i,
    /bypass the rules/i,
    /forget everything/i,
    /act as if/i,
    /do not follow/i,
    /disregard/i,
  ];
  return injectionPatterns.some((pattern) => pattern.test(message));
}

// Extract intent from user message
export function extractIntent(message: string): AILogEntry['intent'] {
  const lower = message.toLowerCase();
  if (/cancel|refund|return|stop|undo/i.test(lower)) return 'CANCEL_ORDER';
  if (/status|track|where is|what happened/i.test(lower)) return 'CHECK_STATUS';
  if (/help|support|question|info/i.test(lower)) return 'GENERAL_HELP';
  if (/order|create|buy|purchase/i.test(lower)) return 'CREATE_ORDER';
  return 'GENERAL_HELP';
}

// Get order status for context
async function getOrderContext(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, items: true, createdAt: true },
    });
    if (!order) return null;

    return {
      id: order.id,
      status: order.status,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      createdAt: order.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

// AI tool: cancel order (FR-004) — deterministic validation
async function cancelOrder(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return { success: false, message: `Order ${orderId} not found.` };
    }

    if (order.status !== 'PENDING') {
      return {
        success: false,
        message: `Order ${orderId} cannot be cancelled. Current status: ${order.status}. Cancellation is only allowed for PENDING orders.`,
      };
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    return { success: true, message: `Order ${orderId} has been successfully cancelled.` };
  } catch (error) {
    return { success: false, message: `Error cancelling order: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

// Build RAG context from knowledge base
export function buildRAGContext(intent: string): string {
  const relevantRules = knowledgeBase.filter((kb) => {
    const lower = kb.context.toLowerCase();
    if (intent === 'CANCEL_ORDER') return lower.includes('cancel');
    if (intent === 'CHECK_STATUS') return lower.includes('status') || lower.includes('update');
    return true;
  });

  return relevantRules.map((kb) => `[${kb.context}] ${kb.rule}`).join('\n\n');
}

// Persist AI log to database
async function persistAILog(log: AILogEntry, orderId?: string): Promise<void> {
  try {
    await prisma.aILog.create({
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
    // Fail silently — logging should never break the main flow
    console.error('[AI LOG PERSIST ERROR]', error);
  }
}

// Extract order ID from message
function extractOrderIdFromMessage(message: string): string | null {
  const uuidMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuidMatch ? uuidMatch[0] : null;
}

// Main AI agent function
export async function processAIRequest(
  message: string,
  orderId?: string
): Promise<{ response: string; log: AILogEntry }> {
  const startTime = Date.now();
  const promptInjectionDetected = detectPromptInjection(message);
  const intent = extractIntent(message);

  const log: AILogEntry = {
    intent,
    model: 'local-deterministic',
    tokensUsed: message.length,
    responseTimeMs: 0,
    toolCalled: null,
    toolSuccess: null,
    promptInjectionDetected,
    rawInput: message,
    rawOutput: '',
  };

  // Guardrail: reject prompt injection
  if (promptInjectionDetected) {
    log.responseTimeMs = Date.now() - startTime;
    log.rawOutput = 'I cannot process this request. Please rephrase your question.';
    await persistAILog(log, orderId);
    return {
      response: 'I cannot process this request. Please rephrase your question.',
      log,
    };
  }

  const ragContext = buildRAGContext(intent);

  // Get order context if provided
  let orderContext = null;
  if (orderId) {
    orderContext = await getOrderContext(orderId);
  }

  // Handle cancel intent with tool calling
  if (intent === 'CANCEL_ORDER') {
    const targetOrderId = orderId || extractOrderIdFromMessage(message);

    if (!targetOrderId) {
      log.responseTimeMs = Date.now() - startTime;
      log.rawOutput = 'Please provide the order ID you want to cancel.';
      await persistAILog(log, orderId);
      return {
        response: 'Please provide the order ID you want to cancel.',
        log,
      };
    }

    log.toolCalled = 'CANCEL_ORDER';
    const result = await cancelOrder(targetOrderId);
    log.toolSuccess = result.success;
    log.rawOutput = result.message;
    log.responseTimeMs = Date.now() - startTime;
    await persistAILog(log, targetOrderId);

    return { response: result.message, log };
  }

  // Handle check status intent
  if (intent === 'CHECK_STATUS') {
    const targetOrderId = orderId || extractOrderIdFromMessage(message);

    if (!targetOrderId) {
      log.responseTimeMs = Date.now() - startTime;
      log.rawOutput = 'Please provide the order ID you want to check.';
      await persistAILog(log, orderId);
      return {
        response: 'Please provide the order ID you want to check.',
        log,
      };
    }

    const order = await getOrderContext(targetOrderId);
    log.responseTimeMs = Date.now() - startTime;
    await persistAILog(log, targetOrderId);

    if (!order) {
      return {
        response: `Order ${targetOrderId} not found.`,
        log,
      };
    }

    return {
      response: `Order ${order.id} is currently ${order.status}. Created on ${new Date(order.createdAt).toLocaleDateString()}.`,
      log,
    };
  }

  // General help response with RAG context
  log.responseTimeMs = Date.now() - startTime;
  log.rawOutput = `Here's what I can help you with:\n\n${ragContext}\n\n${orderContext ? `Your order ${orderContext.id} is currently ${orderContext.status}.` : 'Please provide an order ID for specific information.'}`;
  await persistAILog(log, orderId);

  return {
    response: `Here's what I can help you with:\n\n${ragContext}\n\n${orderContext ? `Your order ${orderContext.id} is currently ${orderContext.status}.` : 'Please provide an order ID for specific information.'}`,
    log,
  };
}
