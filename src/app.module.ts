import { MiddlewareConsumer, Module } from "@nestjs/common";
import { PrismaModule } from "./common/prisma/prisma.module";
import { LoggingModule } from "./common/logging/logging.module";
import { OrdersModule } from "./orders/orders.module";
import { AiAgentModule } from "./ai-agent/ai-agent.module";
import { BackgroundJobModule } from "./background-job/background-job.module";
import { HealthController } from "./common/health/health.controller";
import { CorrelationIdMiddleware } from "./common/logging/correlation-id.middleware";

@Module({
  imports: [
    PrismaModule,
    LoggingModule,
    OrdersModule,
    AiAgentModule,
    BackgroundJobModule,
  ],
  controllers: [HealthController],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
