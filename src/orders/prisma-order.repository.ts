import { Injectable } from '@nestjs/common';
import { OrderRepository } from '../domain/order/order.repository';
import { Order } from '../domain/order/order.entity';
import { OrderItem } from '../domain/order/order-item.entity';
import { OrderStatus } from '../domain/order/order-status';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return null;
    return new Order({
      id: order.id,
      status: order.status as OrderStatus,
      items: order.items.map((i) => new OrderItem(i)),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });
  }

  async findAll(status?: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: status ? { status: status as any } : undefined,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => new Order({
      id: o.id,
      status: o.status as OrderStatus,
      items: o.items.map((i) => new OrderItem(i)),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));
  }

  async create(order: Order): Promise<Order> {
    const created = await this.prisma.order.create({
      data: {
        status: order.status as any,
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
    return new Order({
      id: created.id,
      status: created.status as OrderStatus,
      items: created.items.map((i) => new OrderItem(i)),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: { status: status as any },
    });
  }
}
