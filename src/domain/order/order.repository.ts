import { Order } from "./order.entity";

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  findAll(status?: string): Promise<Order[]>;
  create(order: Order): Promise<Order>;
  updateStatus(id: string, status: string): Promise<void>;
  updateStatusIfPending(id: string, newStatus: string): Promise<boolean>;
}

export const ORDER_REPOSITORY = "ORDER_REPOSITORY";
