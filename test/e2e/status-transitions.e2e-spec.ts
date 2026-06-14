import request from 'supertest';
import { app } from '../support/e2e-app';

const API = `/api/orders`;

describe('E2E: Order Status Transitions', () => {
  it('should create order in PENDING status', async () => {
    const res = await request(app.getHttpServer())
      .post(API)
      .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 10 }] });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
  });

  it('should allow cancellation only for PENDING orders', async () => {
    const createRes = await request(app.getHttpServer())
      .post(API)
      .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 10 }] });

    // Should cancel
    const cancelRes = await request(app.getHttpServer())
      .delete(`${API}/${createRes.body.id}`);
    expect(cancelRes.status).toBe(200);

    // Verify order is CANCELLED
    const getRes = await request(app.getHttpServer())
      .get(`${API}/${createRes.body.id}`);
    expect(getRes.body.status).toBe('CANCELLED');
  });

  it('should list orders filtered by status', async () => {
    // Create two PENDING orders
    await request(app.getHttpServer())
      .post(API)
      .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 10 }] });
    await request(app.getHttpServer())
      .post(API)
      .send({ items: [{ productId: 'p2', quantity: 2, unitPrice: 20 }] });

    const pendingRes = await request(app.getHttpServer())
      .get(API)
      .query({ status: 'PENDING' });
    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body.length).toBe(2);

    const cancelledRes = await request(app.getHttpServer())
      .get(API)
      .query({ status: 'CANCELLED' });
    expect(cancelledRes.status).toBe(200);
    expect(cancelledRes.body.length).toBe(0);
  });

  it('should reject cancellation of already cancelled order', async () => {
    const createRes = await request(app.getHttpServer())
      .post(API)
      .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 10 }] });

    await request(app.getHttpServer()).delete(`${API}/${createRes.body.id}`);

    const res = await request(app.getHttpServer())
      .delete(`${API}/${createRes.body.id}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('cannot be cancelled');
  });
});
