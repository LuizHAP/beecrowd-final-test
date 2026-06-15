import { Module } from "@nestjs/common";
import { HealthController } from "./common/health/health.controller";
import { PrismaModule } from "./common/prisma/prisma.module";
import { OrdersModule } from "./orders/orders.module";
import { BackgroundJobModule } from "./background-job/background-job.module";
import { AiAgentModule } from "./ai-agent/ai-agent.module";

@Module({
  imports: [PrismaModule, OrdersModule, BackgroundJobModule, AiAgentModule],
  controllers: [HealthController],
})
export class AppModule {}
