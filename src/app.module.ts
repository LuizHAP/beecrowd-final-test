import { Module } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';
import { HealthController } from './common/health/health.controller';
import { OrdersModule } from './orders/orders.module';
import { BackgroundJobModule } from './background-job/background-job.module';
import { AiAgentModule } from './ai-agent/ai-agent.module';

@Module({
  imports: [OrdersModule, BackgroundJobModule, AiAgentModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
