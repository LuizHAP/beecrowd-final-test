import { Module } from "@nestjs/common";
import { AiAgentService } from "./ai-agent.service";
import { AiAgentController } from "./ai-agent.controller";
import { PrismaOrderRepository } from "../orders/prisma-order.repository";
import { PrismaModule } from "../common/prisma/prisma.module";
import { LLMService } from "./llm.service";

@Module({
  imports: [PrismaModule],
  controllers: [AiAgentController],
  providers: [AiAgentService, LLMService, PrismaOrderRepository],
  exports: [AiAgentService],
})
export class AiAgentModule {}
