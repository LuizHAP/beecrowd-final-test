import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Order } from "../domain/order/order.entity";
import { OrderItem } from "../domain/order/order-item.entity";
import { OrderStatus } from "../domain/order/order-status";
import { PrismaOrderRepository } from "./prisma-order.repository";
import { CreateOrderDto, ListOrdersDto, OrderResponseDto } from "./dto";

@Injectable()
export class OrdersService {
  constructor(private readonly orderRepo: PrismaOrderRepository) {}

  async create(dto: CreateOrderDto): Promise<Order> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Order must contain at least one item");
    }
    const orderItems = dto.items.map(
      (item) =>
        new OrderItem({
          id: "",
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }),
    );
    const order = new Order({
      id: "",
      status: OrderStatus.PENDING,
      items: orderItems,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.orderRepo.create(order);
  }

  async findAll(dto: ListOrdersDto): Promise<Order[]> {
    return this.orderRepo.findAll(dto.status);
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return order;
  }

  async cancel(id: string): Promise<void> {
    const order = await this.orderRepo.findById(id);
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    if (!order.canCancel()) {
      throw new BadRequestException(
        `Order cannot be cancelled. Current status: ${order.status}`,
      );
    }
    order.cancel();
    await this.orderRepo.updateStatus(id, OrderStatus.CANCELLED);
  }

  toResponseDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      status: order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
