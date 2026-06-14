import { describe, it, expect } from 'vitest';
import {
  CreateItemDto,
  CreateOrderDto,
  ListOrdersDto,
} from './dto';

describe('CreateItemDto', () => {
  it('has expected properties', () => {
    const dto = new CreateItemDto();
    dto.productId = 'prod-1';
    dto.quantity = 2;
    dto.unitPrice = 10;

    expect(dto.productId).toBe('prod-1');
    expect(dto.quantity).toBe(2);
    expect(dto.unitPrice).toBe(10);
  });
});

describe('CreateOrderDto', () => {
  it('has items array', () => {
    const dto = new CreateOrderDto();
    dto.items = [
      { productId: 'prod-1', quantity: 1, unitPrice: 10 },
      { productId: 'prod-2', quantity: 3, unitPrice: 20 },
    ];

    expect(dto.items).toHaveLength(2);
    expect(dto.items[0].productId).toBe('prod-1');
    expect(dto.items[1].quantity).toBe(3);
  });
});

describe('ListOrdersDto', () => {
  it('has optional status property', () => {
    const dto = new ListOrdersDto();
    dto.status = 'PENDING';

    expect(dto.status).toBe('PENDING');
  });

  it('works without status', () => {
    const dto = new ListOrdersDto();

    expect(dto.status).toBeUndefined();
  });
});
