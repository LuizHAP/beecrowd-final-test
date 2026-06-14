import { OrdersModule } from '@/orders/orders.module';

describe('OrdersModule', () => {
  it('is defined', () => {
    expect(OrdersModule).toBeDefined();
  });

  it('is a class', () => {
    expect(typeof OrdersModule).toBe('function');
  });
});
