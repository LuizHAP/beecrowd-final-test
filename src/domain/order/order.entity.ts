import { OrderItem } from './order-item.entity';
import { OrderStatus, isCancellable } from './order-status';

export class Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: {
    id: string;
    status: OrderStatus;
    items: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    Object.assign(this, data);
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  canCancel(): boolean {
    return isCancellable(this.status);
  }

  cancel(): void {
    if (!this.canCancel()) {
      throw new Error(`Order cannot be cancelled. Current status: ${this.status}`);
    }
    this.status = OrderStatus.CANCELLED;
    this.updatedAt = new Date();
  }
}
