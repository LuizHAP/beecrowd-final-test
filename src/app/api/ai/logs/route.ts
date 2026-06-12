import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Get AI logs for observability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const intent = searchParams.get('intent');
    const injection = searchParams.get('injection');

    const where: Record<string, unknown> = {};
    if (intent) where.intent = intent;
    if (injection !== null) where.promptInjectionDetected = injection === 'true';

    const logs = await prisma.aILog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
