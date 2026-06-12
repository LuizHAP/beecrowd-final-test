import { NextResponse } from 'next/server';
import { processAIRequest } from '@/lib/ai-agent';

// FR-005: AI Support Agent endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, orderId } = body as { message: string; orderId?: string };

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const { response, log } = await processAIRequest(message, orderId);

    return NextResponse.json({ response, log });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
