import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { LoggingService } from "../logging/logging.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  private logger: LoggingService;

  constructor(
    private prisma: PrismaService,
    loggingService: LoggingService,
  ) {
    this.logger = loggingService.child("Health");
  }

  @Get()
  @ApiOperation({ summary: "Health check" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.logger.info("Health check passed");
      return {
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch {
      this.logger.warn("Health check failed — database disconnected");
      return { status: "degraded", database: "disconnected" };
    }
  }
}
