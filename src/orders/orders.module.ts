import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaOrderRepository } from './prisma-order.repository';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, PrismaOrderRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
