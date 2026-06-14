import request from 'supertest';
import { app } from '../support/e2e-app';

const API = `/api/orders`;
const NON_EXISTENT_ORDER_ID = '00000000-0000-0000-0000-000000000000';

describe('E2E: Order CRUD', () => {
  describe('POST /api/orders', () => {
    it('should create an order with items', async () => {
      const res = await request(app.getHttpServer())
        .post(API)
        .send({
          items: [
            { productId: 'prod-1', quantity: 2, unitPrice: 50 },
            { productId: 'prod-2', quantity: 1, unitPrice: 100 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('PENDING');
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(200);
    });

    it('should reject empty items array', async () => {
      const res = await request(app.getHttpServer())
        .post(API)
        .send({ items: [] });

      expect(res.status).toBe(400);
    });

    it('should reject missing items', async () => {
      const res = await request(app.getHttpServer())
        .post(API)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should list all orders', async () => {
      await request(app.getHttpServer())
        .post(API)
        .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 10 }] });

      const res = await request(app.getHttpServer()).get(API);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by status', async () => {
      await request(app.getHttpServer())
        .post(API)
        .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 10 }] });

      const res = await request(app.getHttpServer())
        .get(API)
        .query({ status: 'PENDING' });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((order: any) => {
        expect(order.status).toBe('PENDING');
      });
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return 404 for non-existent order', async () => {
      const res = await request(app.getHttpServer()).get(`${API}/${NON_EXISTENT_ORDER_ID}`);
      expect(res.status).toBe(404);
    });

    it('should return order details', async () => {
      const createRes = await request(app.getHttpServer())
        .post(API)
        .send({ items: [{ productId: 'p1', quantity: 3, unitPrice: 25 }] });

      const orderId = createRes.body.id;

      const res = await request(app.getHttpServer()).get(`${API}/${orderId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(orderId);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.total).toBe(75);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should cancel a PENDING order', async () => {
      const createRes = await request(app.getHttpServer())
        .post(API)
        .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 50 }] });

      const orderId = createRes.body.id;

      const res = await request(app.getHttpServer()).delete(`${API}/${orderId}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toBeDefined();
      expect(res.body.order.status).toBe('CANCELLED');
    });

    it('should reject cancellation of non-PENDING order', async () => {
      const createRes = await request(app.getHttpServer())
        .post(API)
        .send({ items: [{ productId: 'p1', quantity: 1, unitPrice: 50 }] });

      const orderId = createRes.body.id;

      // First cancel it
      await request(app.getHttpServer()).delete(`${API}/${orderId}`);

      // Try to cancel again
      const res = await request(app.getHttpServer()).delete(`${API}/${orderId}`);
      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent order', async () => {
      const res = await request(app.getHttpServer()).delete(`${API}/${NON_EXISTENT_ORDER_ID}`);
      expect(res.status).toBe(404);
    });
  });
});
