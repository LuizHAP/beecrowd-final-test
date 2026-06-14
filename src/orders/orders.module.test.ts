import { describe, it, expect } from 'vitest';
import { OrdersModule } from './orders.module';

describe('OrdersModule', () => {
  it('is defined', () => {
    expect(OrdersModule).toBeDefined();
  });

  it('is a class', () => {
    expect(typeof OrdersModule).toBe('function');
  });
});
