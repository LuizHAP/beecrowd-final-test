import { Injectable } from "@nestjs/common";
import { OrderRepository } from "../domain/order/order.repository";
import { Order } from "../domain/order/order.entity";
import { OrderItem } from "../domain/order/order-item.entity";
import { OrderStatus } from "../domain/order/order-status";
import { PrismaService } from "../common/prisma/prisma.service";

type PrismaStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface PrismaOrder {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return null;
    return this.toDomain(order as unknown as PrismaOrder);
  }

  async findAll(status?: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: status ? { status: status as PrismaStatus } : undefined,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return (orders as unknown as PrismaOrder[]).map((o) => this.toDomain(o));
  }

  async create(order: Order): Promise<Order> {
    const created = await this.prisma.order.create({
      data: {
        status: order.status as PrismaStatus,
        items: {
          create: order.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
    return this.toDomain(created as unknown as PrismaOrder);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: { status: status as PrismaStatus },
    });
  }

  private toDomain(raw: PrismaOrder): Order {
    return new Order({
      id: raw.id,
      status: raw.status as OrderStatus,
      items: raw.items.map((i) => new OrderItem(i)),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
