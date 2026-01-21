import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { couponHandlers } from './handlers/coupon';

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

// 健康检查
app.get('/health', (c) => c.json({ status: 'ok', service: 'marketing-service' }));

// 优惠券路由
app.get('/coupons', couponHandlers.list);
app.get('/coupons/:id', couponHandlers.get);
app.post('/coupons', couponHandlers.create);
app.put('/coupons/:id', couponHandlers.update);
app.delete('/coupons/:id', couponHandlers.delete);
app.post('/coupons/:id/claim', couponHandlers.claim);
app.post('/user-coupons/:userCouponId/use', couponHandlers.use);
app.get('/users/:userId/coupons', couponHandlers.getUserCoupons);
app.post('/coupons/distribute', couponHandlers.distribute); // 批量下发优惠券

export default app;
