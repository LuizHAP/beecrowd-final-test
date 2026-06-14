import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';
import { PrismaOrderRepository } from '../orders/prisma-order.repository';
import { PrismaService } from '../common/prisma/prisma.service';

@Module({
  controllers: [AiAgentController],
  providers: [AiAgentService, PrismaOrderRepository, PrismaService],
  exports: [AiAgentService],
})
export class AiAgentModule {}
