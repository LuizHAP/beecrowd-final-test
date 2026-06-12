import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateOrderDto, ListOrdersDto, OrderResponseDto } from './dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    const { items } = dto;

    for (const item of items) {
      if (!item.productId || item.quantity <= 0 || item.unitPrice < 0) {
        throw new ConflictException('Each item must have productId, quantity > 0, and unitPrice >= 0');
      }
    }

    const order = await this.prisma.order.create({
      data: {
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return this.toResponseDto(order);
  }

  async findAll(dto: ListOrdersDto): Promise<OrderResponseDto[]> {
    const where: Record<string, string> = {};
    if (dto.status) {
      where.status = dto.status;
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.toResponseDto(o));
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponseDto(order);
  }

  async cancel(id: string): Promise<{ message: string; order: OrderResponseDto }> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new ConflictException(`Order cannot be cancelled. Current status: ${order.status}`);
    }

    const cancelled = await this.prisma.order.delete({
      where: { id },
    });

    return { message: 'Order cancelled', order: this.toResponseDto(cancelled) };
  }

  private toResponseDto(order: any): OrderResponseDto {
    const total = order.items.reduce((sum: number, item: any) => sum + item.unitPrice * item.quantity, 0);
    return {
      ...order,
      total,
    };
  }
}
