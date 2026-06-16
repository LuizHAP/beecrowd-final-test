import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from "@nestjs/swagger";
import { AiAgentService } from "./ai-agent.service";

@ApiTags("ai-agent")
@Controller("ai")
export class AiAgentController {
  constructor(private aiService: AiAgentService) {}

  @Post("chat")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Process a message with the AI agent" })
  @ApiResponse({ status: 200, description: "Message processed successfully" })
  async chat(@Body() body: { message: string; orderId?: string }) {
    if (!body.message || typeof body.message !== "string") {
      throw new BadRequestException("Message is required and must be a string");
    }
    return this.aiService.process(body.message, body.orderId);
  }

  @Get("logs")
  @ApiOperation({ summary: "Get AI agent logs" })
  @ApiQuery({
    required: false,
    name: "limit",
    description: "Number of logs to return (1-100)",
  })
  @ApiQuery({
    required: false,
    name: "intent",
    description: "Filter by intent",
  })
  @ApiQuery({
    required: false,
    name: "injection",
    description: "Filter by prompt injection",
  })
  @ApiResponse({ status: 200, description: "Logs retrieved successfully" })
  async getLogs(
    @Query("limit") limit?: string,
    @Query("intent") intent?: string,
    @Query("injection") injection?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      throw new BadRequestException("Limit must be a positive number");
    }
    const logs = await this.aiService.getLogs(
      Math.min(parsedLimit, 100),
      intent,
      injection === "true" ? true : injection === "false" ? false : undefined,
    );
    return { logs };
  }
}
