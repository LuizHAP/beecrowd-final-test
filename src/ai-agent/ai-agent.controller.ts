import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AiAgentService } from './ai-agent.service';

@ApiTags('ai-agent')
@Controller('ai')
export class AiAgentController {
  constructor(private aiService: AiAgentService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Process a message with the AI agent' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  async chat(@Body() body: { message: string; orderId?: string }) {
    if (!body.message || typeof body.message !== 'string') {
      return { response: 'Message is required', log: null };
    }
    return this.aiService.process(body.message, body.orderId);
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get AI agent logs' })
  @ApiQuery({ required: false, name: 'limit', description: 'Number of logs to return' })
  @ApiQuery({ required: false, name: 'intent', description: 'Filter by intent' })
  @ApiQuery({ required: false, name: 'injection', description: 'Filter by prompt injection' })
  @ApiResponse({ status: 200, description: 'Logs retrieved successfully' })
  async getLogs(
    @Query('limit') limit?: string,
    @Query('intent') intent?: string,
    @Query('injection') injection?: string,
  ) {
    const logs = await this.aiService.getLogs(
      limit ? parseInt(limit) : 50,
      intent,
      injection === 'true' ? true : injection === 'false' ? false : undefined,
    );
    return { logs };
  }
}
