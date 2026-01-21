import { Context } from 'hono';
import { WarehouseService } from '../services/warehouse.service';
import type {
  Env,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
} from '../types';

export class WarehouseHandler {
  /**
   * GET /warehouses - 获取仓库列表
   */
  static async getWarehouses(c: Context<Env>) {
    try {
      const status = c.req.query('status');
      const page = parseInt(c.req.query('page') || '1');
      const pageSize = parseInt(c.req.query('page_size') || '20');

      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return c.json(
          { error: 'Invalid pagination parameters' },
          400
        );
      }

      const service = new WarehouseService(c.env.DB);
      const result = await service.getWarehouses({
        status,
        page,
        page_size: pageSize,
      });

      return c.json(result);
    } catch (error) {
      console.error('Get warehouses error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to get warehouses' },
        500
      );
    }
  }

  /**
   * POST /warehouses - 创建仓库
   */
  static async createWarehouse(c: Context<Env>) {
    try {
      const body = await c.req.json<CreateWarehouseRequest>();

      // 验证请求
      if (!body.name || !body.code) {
        return c.json(
          { error: 'Missing required fields: name, code' },
          400
        );
      }

      const service = new WarehouseService(c.env.DB);
      const warehouse = await service.createWarehouse(body);

      return c.json(warehouse, 201);
    } catch (error) {
      console.error('Create warehouse error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to create warehouse' },
        error instanceof Error && error.message.includes('already exists') ? 409 : 500
      );
    }
  }

  /**
   * GET /warehouses/:id - 获取仓库详情
   */
  static async getWarehouse(c: Context<Env>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid warehouse ID' }, 400);
      }

      const service = new WarehouseService(c.env.DB);
      const warehouse = await service.getWarehouseById(id);

      if (!warehouse) {
        return c.json({ error: 'Warehouse not found' }, 404);
      }

      return c.json(warehouse);
    } catch (error) {
      console.error('Get warehouse error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to get warehouse' },
        500
      );
    }
  }

  /**
   * PUT /warehouses/:id - 更新仓库
   */
  static async updateWarehouse(c: Context<Env>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid warehouse ID' }, 400);
      }

      const body = await c.req.json<UpdateWarehouseRequest>();

      const service = new WarehouseService(c.env.DB);
      const warehouse = await service.updateWarehouse(id, body);

      return c.json(warehouse);
    } catch (error) {
      console.error('Update warehouse error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to update warehouse' },
        error instanceof Error && error.message.includes('not found') ? 404 : 500
      );
    }
  }

  /**
   * DELETE /warehouses/:id - 删除仓库
   */
  static async deleteWarehouse(c: Context<Env>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid warehouse ID' }, 400);
      }

      const service = new WarehouseService(c.env.DB);
      await service.deleteWarehouse(id);

      return c.json({ success: true });
    } catch (error) {
      console.error('Delete warehouse error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to delete warehouse' },
        error instanceof Error && error.message.includes('with inventory') ? 409 : 500
      );
    }
  }

  /**
   * GET /warehouses/:id/stats - 获取仓库库存统计
   */
  static async getWarehouseStats(c: Context<Env>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid warehouse ID' }, 400);
      }

      const service = new WarehouseService(c.env.DB);
      const stats = await service.getWarehouseInventoryStats(id);

      return c.json(stats);
    } catch (error) {
      console.error('Get warehouse stats error:', error);
      return c.json(
        { error: error instanceof Error ? error.message : 'Failed to get warehouse stats' },
        error instanceof Error && error.message.includes('not found') ? 404 : 500
      );
    }
  }
}
