import { prisma } from './prisma';

/**
 * FR-003: Background job that transitions PENDING orders to PROCESSING every 5 minutes.
 *
 * Concurrency safety: Uses SELECT ... FOR UPDATE SKIP LOCKED to prevent race conditions
 * when multiple instances of the microservice run simultaneously (Kubernetes scaling).
 * Only one instance will lock and update each batch of orders.
 */
export async function transitionPendingToProcessing(): Promise<{
  updated: number;
  error?: string;
}> {
  try {
    // Atomic: lock only PENDING rows, skip already-locked ones
    const result = await prisma.$executeRawUnsafe(`
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

    return { updated: result };
  } catch (error) {
    return { updated: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Schedule the background job to run every 5 minutes.
 * In production, use a proper job scheduler (e.g., Kubernetes CronJob, BullMQ).
 * For local development, this uses setInterval.
 */
let intervalId: ReturnType<typeof setInterval> | null = null;

export function startBackgroundJob() {
  if (intervalId) return; // Prevent duplicate scheduling

  // Run immediately on start
  transitionPendingToProcessing().catch(console.error);

  intervalId = setInterval(() => {
    transitionPendingToProcessing().catch(console.error);
  }, 5 * 60 * 1000); // 5 minutes
}

export function stopBackgroundJob() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
