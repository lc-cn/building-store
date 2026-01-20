import { Context } from 'hono';
import { InventoryService } from '../services/inventory.service';
import type {
  Env,
  AdjustInventoryRequest,
  ReserveInventoryRequest,
  ReleaseInventoryRequest,
} from '../types';

export class InventoryHandler {
  /**
   * GET /inventory/:sku - 查询SKU库存
   */
  static async getInventory(c: Context<Env>) {
    try {
      const sku = c.req.param('sku');
      const service = new InventoryService(c.env.DB);

      const inventory = await service.getInventoryBySku(sku);

      if (!inventory) {
        return c.json({ error: 'Inventory not found' }, 404);
      }

      const availableQuantity = inventory.quantity - inventory.reserved_quantity;
      const isLowStock = inventory.quantity <= inventory.low_stock_threshold;

      return c.json({
        inventory,
        available_quantity: availableQuantity,
        is_low_stock: isLowStock,
      });
    } catch (error) {
      console.error('Get inventory error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to get inventory' },
        500
      );
    }
  }

  /**
   * POST /inventory/adjust - 库存调整
   */
  static async adjustInventory(c: Context<Env>) {
    try {
      const body = await c.req.json<AdjustInventoryRequest>();

      // 验证请求
      if (!body.sku || body.quantity === undefined || !body.type) {
        return c.json(
          { error: 'Missing required fields: sku, quantity, type' },
          400
        );
      }

      if (!['in', 'out', 'adjust'].includes(body.type)) {
        return c.json(
          { error: 'Invalid type. Must be: in, out, or adjust' },
          400
        );
      }

      if (body.quantity < 0) {
        return c.json({ error: 'Quantity must be non-negative' }, 400);
      }

      const service = new InventoryService(c.env.DB);
      const result = await service.adjustInventory(body);

      return c.json({
        success: true,
        inventory: result.inventory,
        transaction: result.transaction,
      });
    } catch (error) {
      console.error('Adjust inventory error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to adjust inventory' },
        error instanceof Error && error.message.includes('Insufficient') ? 400 : 500
      );
    }
  }

  /**
   * POST /inventory/reserve - 库存预留
   */
  static async reserveInventory(c: Context<Env>) {
    try {
      const body = await c.req.json<ReserveInventoryRequest>();

      // 验证请求
      if (!body.sku || !body.quantity || !body.order_id) {
        return c.json(
          { error: 'Missing required fields: sku, quantity, order_id' },
          400
        );
      }

      if (body.quantity <= 0) {
        return c.json({ error: 'Quantity must be positive' }, 400);
      }

      const service = new InventoryService(c.env.DB);
      const result = await service.reserveInventory(body);

      return c.json({
        success: true,
        reservation: result.reservation,
        inventory: result.inventory,
      });
    } catch (error) {
      console.error('Reserve inventory error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to reserve inventory' },
        error instanceof Error && error.message.includes('Insufficient') ? 400 : 500
      );
    }
  }

  /**
   * POST /inventory/release - 库存释放
   */
  static async releaseInventory(c: Context<Env>) {
    try {
      const body = await c.req.json<ReleaseInventoryRequest>();

      // 验证请求
      if (!body.order_id) {
        return c.json({ error: 'Missing required field: order_id' }, 400);
      }

      const service = new InventoryService(c.env.DB);
      const result = await service.releaseInventory(body);

      return c.json({
        success: true,
        released_count: result.released_count,
        reservations: result.reservations,
      });
    } catch (error) {
      console.error('Release inventory error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to release inventory' },
        500
      );
    }
  }

  /**
   * GET /inventory/transactions - 库存变动记录
   */
  static async getTransactions(c: Context<Env>) {
    try {
      const sku = c.req.query('sku');
      const type = c.req.query('type');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('page_size') || '20');

      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return c.json(
          { error: 'Invalid pagination parameters' },
          400
        );
      }

      const service = new InventoryService(c.env.DB);
      const result = await service.getTransactions({
        sku,
        type,
        page,
        page_size: pageSize,
      });

      return c.json(result);
    } catch (error) {
      console.error('Get transactions error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to get transactions' },
        500
      );
    }
  }

  /**
   * POST /inventory/cleanup-expired - 清理过期的预留（可由定时任务调用）
   */
  static async cleanupExpired(c: Context<Env>) {
    try {
      const service = new InventoryService(c.env.DB);
      const count = await service.cleanupExpiredReservations();

      return c.json({
        success: true,
        cleaned_count: count,
      });
    } catch (error) {
      console.error('Cleanup expired reservations error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to cleanup' },
        500
      );
    }
  }
}
