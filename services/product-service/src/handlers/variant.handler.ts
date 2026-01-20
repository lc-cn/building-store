import { Context } from 'hono';
import { VariantService } from '../services/variant.service';
import type { Bindings, CreateVariantInput, UpdateVariantInput } from '../types';

export class VariantHandler {
  static async getVariantsByProductId(c: Context<{ Bindings: Bindings }>) {
    try {
      const productId = parseInt(c.req.param('id'));
      if (isNaN(productId)) {
        return c.json({ success: false, error: '无效的产品ID' }, 400);
      }

      const service = new VariantService(c.env.DB);
      const variants = await service.getVariantsByProductId(productId);

      return c.json({ success: true, data: variants });
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '获取变体失败' },
        500
      );
    }
  }

  static async getVariantById(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的变体ID' }, 400);
      }

      const service = new VariantService(c.env.DB);
      const variant = await service.getVariantById(id);

      if (!variant) {
        return c.json({ success: false, error: '变体不存在' }, 404);
      }

      return c.json({ success: true, data: variant });
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '获取变体失败' },
        500
      );
    }
  }

  static async createVariant(c: Context<{ Bindings: Bindings }>) {
    try {
      const productId = parseInt(c.req.param('id'));
      if (isNaN(productId)) {
        return c.json({ success: false, error: '无效的产品ID' }, 400);
      }

      const body = await c.req.json<CreateVariantInput>();
      body.product_id = productId; // 从 URL 参数设置 product_id

      // 验证必填字段
      if (!body.name || !body.sku || body.price === undefined) {
        return c.json(
          { success: false, error: '缺少必填字段: name, sku, price' },
          400
        );
      }

      // 验证价格
      if (body.price < 0) {
        return c.json(
          { success: false, error: '价格不能为负数' },
          400
        );
      }

      const service = new VariantService(c.env.DB);
      const variant = await service.createVariant(body);

      return c.json({ success: true, data: variant }, 201);
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '创建变体失败' },
        400
      );
    }
  }

  static async updateVariant(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的变体ID' }, 400);
      }

      const body = await c.req.json<UpdateVariantInput>();

      // 验证价格
      if (body.price !== undefined && body.price < 0) {
        return c.json(
          { success: false, error: '价格不能为负数' },
          400
        );
      }

      const service = new VariantService(c.env.DB);
      const variant = await service.updateVariant(id, body);

      return c.json({ success: true, data: variant });
    } catch (error: any) {
      const status = error.message === '变体不存在' ? 404 : 400;
      return c.json(
        { success: false, error: error.message || '更新变体失败' },
        status
      );
    }
  }

  static async deleteVariant(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的变体ID' }, 400);
      }

      const service = new VariantService(c.env.DB);
      await service.deleteVariant(id);

      return c.json({ success: true, message: '变体已删除' });
    } catch (error: any) {
      const status = error.message === '变体不存在' ? 404 : 400;
      return c.json(
        { success: false, error: error.message || '删除变体失败' },
        status
      );
    }
  }
}
