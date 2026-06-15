import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { LoggingService } from "../common/logging/logging.service";

@Injectable()
export class BackgroundJobService implements OnModuleInit, OnModuleDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private logger: LoggingService;

  constructor(
    private prisma: PrismaService,
    loggingService: LoggingService,
  ) {
    this.logger = loggingService.child("BackgroundJob");
  }

  async onModuleInit() {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    this.start();
  }

  onModuleDestroy() {
    this.stop();
  }

  start() {
    if (this.intervalId) return;

    void this.transitionPendingToProcessing();

    this.intervalId = setInterval(
      () => {
        void this.transitionPendingToProcessing();
      },
      5 * 60 * 1000,
    );
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async transitionPendingToProcessing(): Promise<{
    updated: number;
    error?: string;
  }> {
    try {
      const result = await this.prisma.$executeRawUnsafe(`
        UPDATE "Order"
        SET status = 'PROCESSING', "updatedAt" = NOW()
        WHERE id IN (
          SELECT id FROM "Order"
          WHERE status = 'PENDING'
          ORDER BY "createdAt" ASC
          LIMIT 100
          FOR UPDATE SKIP LOCKED
        )
      `);

      this.logger.info("Orders transitioned to PROCESSING", { count: result });
      return { updated: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Background job failed", { error: errorMsg });
      return { updated: 0, error: errorMsg };
    }
  }
}
