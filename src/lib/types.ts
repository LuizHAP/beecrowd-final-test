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

export interface AILog {
  intent: string;
  model: string;
  tokensUsed: number;
  responseTimeMs: number;
  toolCalled: string | null;
  toolSuccess: boolean | null;
  promptInjectionDetected: boolean;
  timestamp: string;
}
