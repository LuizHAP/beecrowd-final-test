import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class BackgroundJobService {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private prisma: PrismaService) {}

  start() {
    if (this.intervalId) return;

    // Run immediately on start
    this.transitionPendingToProcessing().catch(console.error);

    this.intervalId = setInterval(() => {
      this.transitionPendingToProcessing().catch(console.error);
    }, 5 * 60 * 1000); // 5 minutes
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async transitionPendingToProcessing(): Promise<{ updated: number; error?: string }> {
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
        RETURNING id
      `);

      console.log(`[BACKGROUND JOB] Transited ${result} orders to PROCESSING`);
      return { updated: result };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[BACKGROUND JOB] Error:', errorMsg);
      return { updated: 0, error: errorMsg };
    }
  }
}
