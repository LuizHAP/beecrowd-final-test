import { Order } from "./order.entity";

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findAll(status?: string): Promise<Order[]>;
  create(order: Order): Promise<Order>;
  updateStatus(id: string, status: string): Promise<void>;
}
