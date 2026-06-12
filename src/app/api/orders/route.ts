import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OrderItemInput } from '@/lib/types';

// FR-001: Create an order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items } = body as { items: OrderItemInput[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and must not be empty' },
        { status: 400 }
      );
    }

    for (const item of items) {
      if (!item.productId || item.quantity <= 0 || item.unitPrice < 0) {
        return NextResponse.json(
          { error: 'Each item must have productId, quantity > 0, and unitPrice >= 0' },
          { status: 400 }
        );
      }
    }

    const order = await prisma.order.create({
      data: {
        status: 'PENDING',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}

// FR-001: List all orders with optional status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, string> = {};
    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
