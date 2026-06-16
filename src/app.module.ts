import { Module } from "@nestjs/common";
import { PrismaModule } from "./common/prisma/prisma.module";
import { LoggingModule } from "./common/logging/logging.module";
import { OrdersModule } from "./orders/orders.module";
import { AiAgentModule } from "./ai-agent/ai-agent.module";
import { HealthController } from "./common/health/health.controller";

@Module({
  imports: [PrismaModule, LoggingModule, OrdersModule, AiAgentModule],
  controllers: [HealthController],
})
export class AppModule {}
