import { Context } from 'hono';
import { PaymentService } from '../services/payment.service';
import { Env } from '../types';

export class PaymentHandler {
  /**
   * 获取支付记录列表
   * GET /payments
   */
  static async list(c: Context<{ Bindings: Env }>) {
    try {
      const service = new PaymentService(c.env.DB);
      
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const user_id = c.req.query('user_id') ? parseInt(c.req.query('user_id')!) : undefined;
      const status = c.req.query('status');
      const order_id = c.req.query('order_id');

      const result = await service.list({ page, limit, user_id, status, order_id });

      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 创建支付记录
   * POST /payments
   */
  static async create(c: Context<{ Bindings: Env }>) {
    try {
      const service = new PaymentService(c.env.DB);
      const body = await c.req.json();

      // 验证必填字段
      if (!body.order_id || !body.user_id || !body.amount || !body.payment_method) {
        return c.json({ error: 'Missing required fields' }, 400);
      }

      if (body.amount <= 0) {
        return c.json({ error: 'Amount must be positive' }, 400);
      }

      const payment = await service.create(body);

      return c.json(payment, 201);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 获取支付记录详情
   * GET /payments/:id
   */
  static async getById(c: Context<{ Bindings: Env }>) {
    try {
      const service = new PaymentService(c.env.DB);
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid payment ID' }, 400);
      }

      const payment = await service.getById(id);

      if (!payment) {
        return c.json({ error: 'Payment not found' }, 404);
      }

      return c.json(payment);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 更新支付记录
   * PUT /payments/:id
   */
  static async update(c: Context<{ Bindings: Env }>) {
    try {
      const service = new PaymentService(c.env.DB);
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(id)) {
        return c.json({ error: 'Invalid payment ID' }, 400);
      }

      const payment = await service.update(id, body);

      return c.json(payment);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Invalid status transition')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 完成支付
   * POST /payments/:id/complete
   */
  static async complete(c: Context<{ Bindings: Env }>) {
    try {
      const service = new PaymentService(c.env.DB);
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json().catch(() => ({}));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid payment ID' }, 400);
      }

      const payment = await service.complete(id, body.provider_transaction_id);

      return c.json(payment);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Invalid status transition')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 支付失败
   * POST /payments/:id/fail
   */
  static async fail(c: Context<{ Bindings: Env }>) {
    try {
      const service = new PaymentService(c.env.DB);
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json().catch(() => ({}));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid payment ID' }, 400);
      }

      const payment = await service.fail(id, body.reason);

      return c.json(payment);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Invalid status transition')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }
}
