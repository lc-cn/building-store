import { Context } from 'hono';
import { RefundService } from '../services/refund.service';
import { Env } from '../types';

export class RefundHandler {
  /**
   * 获取退款记录列表
   * GET /refunds
   */
  static async list(c: Context<{ Bindings: Env }>) {
    try {
      const service = new RefundService(c.env.DB);
      
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const user_id = c.req.query('user_id') ? parseInt(c.req.query('user_id')!) : undefined;
      const status = c.req.query('status');
      const payment_id = c.req.query('payment_id') ? parseInt(c.req.query('payment_id')!) : undefined;

      const result = await service.list({ page, limit, user_id, status, payment_id });

      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 创建退款记录
   * POST /refunds
   */
  static async create(c: Context<{ Bindings: Env }>) {
    try {
      const service = new RefundService(c.env.DB);
      const body = await c.req.json();

      // 验证必填字段
      if (!body.payment_id || !body.amount) {
        return c.json({ error: 'Missing required fields: payment_id, amount' }, 400);
      }

      if (body.amount <= 0) {
        return c.json({ error: 'Amount must be positive' }, 400);
      }

      const refund = await service.create(body);

      return c.json(refund, 201);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Only completed payments') || error.message.includes('Invalid refund amount') || error.message.includes('exceeds payment amount')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 获取退款记录详情
   * GET /refunds/:id
   */
  static async getById(c: Context<{ Bindings: Env }>) {
    try {
      const service = new RefundService(c.env.DB);
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid refund ID' }, 400);
      }

      const refund = await service.getById(id);

      if (!refund) {
        return c.json({ error: 'Refund not found' }, 404);
      }

      return c.json(refund);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 更新退款记录
   * PUT /refunds/:id
   */
  static async update(c: Context<{ Bindings: Env }>) {
    try {
      const service = new RefundService(c.env.DB);
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();

      if (isNaN(id)) {
        return c.json({ error: 'Invalid refund ID' }, 400);
      }

      const refund = await service.update(id, body);

      return c.json(refund);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Invalid')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 批准退款
   * POST /refunds/:id/approve
   */
  static async approve(c: Context<{ Bindings: Env }>) {
    try {
      const service = new RefundService(c.env.DB);
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json().catch(() => ({}));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid refund ID' }, 400);
      }

      const refund = await service.approve(id, body.operator_id);

      return c.json(refund);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Invalid')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 拒绝退款
   * POST /refunds/:id/reject
   */
  static async reject(c: Context<{ Bindings: Env }>) {
    try {
      const service = new RefundService(c.env.DB);
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json().catch(() => ({}));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid refund ID' }, 400);
      }

      const refund = await service.reject(id, body.reason);

      return c.json(refund);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return c.json({ error: error.message }, 404);
      }
      if (error.message.includes('Invalid')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }
}
