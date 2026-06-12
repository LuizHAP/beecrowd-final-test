import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Health check endpoint
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: 'degraded', database: 'disconnected' },
      { status: 503 }
    );
  }
}
