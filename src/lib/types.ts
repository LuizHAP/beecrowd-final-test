export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AILogEntry {
  intent: 'CANCEL_ORDER' | 'CHECK_STATUS' | 'GENERAL_HELP' | 'CREATE_ORDER';
  model: string;
  tokensUsed: number;
  responseTimeMs: number;
  toolCalled: 'CANCEL_ORDER' | null;
  toolSuccess: boolean | null;
  promptInjectionDetected: boolean;
  rawInput?: string;
  rawOutput?: string;
}
