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

  async create(dto: CreateOrderDto): Promise<OrderResponseDto> {
    const { items } = dto;

    if (!items || items.length === 0) {
      throw new BadRequestException("Order must contain at least one item");
    }

    // Validate items using OrderItem constructor
    const orderItems = items.map(
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

    const created = await this.orderRepo.create(order);
    return this.toResponseDto(created);
  }

  async findAll(dto: ListOrdersDto): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepo.findAll(dto.status);
    return orders.map((o) => this.toResponseDto(o));
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findById(id);
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return this.toResponseDto(order);
  }

  async cancel(
    id: string,
  ): Promise<{ message: string; order: OrderResponseDto }> {
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

    return { message: "Order cancelled", order: this.toResponseDto(order) };
  }

  private toResponseDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      status: order.status,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      total: order.total,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
