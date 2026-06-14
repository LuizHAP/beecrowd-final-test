import { Module } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';
import { AiAgentController } from './ai-agent.controller';
import { PrismaOrderRepository } from '../orders/prisma-order.repository';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiAgentController],
  providers: [AiAgentService, PrismaOrderRepository],
  exports: [AiAgentService],
})
export class AiAgentModule {}
