import { Context } from 'hono';
import { BalanceService } from '../services/balance.service';
import { Env } from '../types';

export class BalanceHandler {
  /**
   * 查询用户余额
   * GET /balance/:user_id
   */
  static async getBalance(c: Context<{ Bindings: Env }>) {
    try {
      const service = new BalanceService(c.env.DB);
      const userId = parseInt(c.req.param('user_id'));

      if (isNaN(userId)) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      const balance = await service.getBalance(userId);

      return c.json(balance);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 充值
   * POST /balance/recharge
   */
  static async recharge(c: Context<{ Bindings: Env }>) {
    try {
      const service = new BalanceService(c.env.DB);
      const body = await c.req.json();

      // 验证必填字段
      if (!body.user_id || !body.amount) {
        return c.json({ error: 'Missing required fields: user_id, amount' }, 400);
      }

      if (body.amount <= 0) {
        return c.json({ error: 'Amount must be positive' }, 400);
      }

      const balance = await service.recharge(body);

      return c.json(balance);
    } catch (error: any) {
      if (error.message.includes('must be positive')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 余额变动记录
   * GET /balance/:user_id/transactions
   */
  static async getTransactions(c: Context<{ Bindings: Env }>) {
    try {
      const service = new BalanceService(c.env.DB);
      const userId = parseInt(c.req.param('user_id'));

      if (isNaN(userId)) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      const type = c.req.query('type');

      const result = await service.getTransactions({ user_id: userId, page, limit, type });

      return c.json(result);
    } catch (error: any) {
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 冻结余额
   * POST /balance/:user_id/freeze
   */
  static async freeze(c: Context<{ Bindings: Env }>) {
    try {
      const service = new BalanceService(c.env.DB);
      const userId = parseInt(c.req.param('user_id'));
      const body = await c.req.json();

      if (isNaN(userId)) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      if (!body.amount) {
        return c.json({ error: 'Missing required field: amount' }, 400);
      }

      if (body.amount <= 0) {
        return c.json({ error: 'Amount must be positive' }, 400);
      }

      const balance = await service.freeze(userId, body.amount, body.note);

      return c.json(balance);
    } catch (error: any) {
      if (error.message.includes('Insufficient')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }

  /**
   * 解冻余额
   * POST /balance/:user_id/unfreeze
   */
  static async unfreeze(c: Context<{ Bindings: Env }>) {
    try {
      const service = new BalanceService(c.env.DB);
      const userId = parseInt(c.req.param('user_id'));
      const body = await c.req.json();

      if (isNaN(userId)) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      if (!body.amount) {
        return c.json({ error: 'Missing required field: amount' }, 400);
      }

      if (body.amount <= 0) {
        return c.json({ error: 'Amount must be positive' }, 400);
      }

      const balance = await service.unfreeze(userId, body.amount, body.note);

      return c.json(balance);
    } catch (error: any) {
      if (error.message.includes('Insufficient')) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: error.message }, 500);
    }
  }
}
