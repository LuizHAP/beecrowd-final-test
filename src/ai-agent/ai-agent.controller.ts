import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AiAgentService } from './ai-agent.service';

@Controller('ai')
export class AiAgentController {
  constructor(private aiService: AiAgentService) {}

  @Post('chat')
  async chat(@Body() body: { message: string; orderId?: string }) {
    if (!body.message || typeof body.message !== 'string') {
      return { response: 'Message is required', log: null };
    }
    return this.aiService.process(body.message, body.orderId);
  }

  @Get('logs')
  async getLogs(
    @Query('limit') limit?: string,
    @Query('intent') intent?: string,
    @Query('injection') injection?: string,
  ) {
    const logs = await this.aiService.getLogs(
      parseInt(limit) || 50,
      intent,
      injection === 'true' ? true : injection === 'false' ? false : undefined,
    );
    return { logs };
  }
}
