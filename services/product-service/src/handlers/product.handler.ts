import { Context } from 'hono';
import { ProductService } from '../services/product.service';
import type { Bindings, CreateProductInput, UpdateProductInput } from '../types';

export class ProductHandler {
  static async searchProducts(c: Context<{ Bindings: Bindings }>) {
    try {
      const service = new ProductService(c.env.DB);
      
      const params = {
        category_id: c.req.query('category_id') 
          ? parseInt(c.req.query('category_id')!) 
          : undefined,
        status: c.req.query('status'),
        featured: c.req.query('featured') === 'true' ? true : undefined,
        search: c.req.query('search'),
        min_price: c.req.query('min_price') 
          ? parseFloat(c.req.query('min_price')!) 
          : undefined,
        max_price: c.req.query('max_price') 
          ? parseFloat(c.req.query('max_price')!) 
          : undefined,
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : 1,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20,
        sort: c.req.query('sort') || 'created_at',
        order: (c.req.query('order') as 'asc' | 'desc') || 'desc',
      };

      const result = await service.searchProducts(params);

      return c.json({ 
        success: true, 
        ...result 
      });
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '搜索产品失败' },
        500
      );
    }
  }

  static async getProductById(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的产品ID' }, 400);
      }

      const service = new ProductService(c.env.DB);
      const product = await service.getProductById(id);

      if (!product) {
        return c.json({ success: false, error: '产品不存在' }, 404);
      }

      return c.json({ success: true, data: product });
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '获取产品失败' },
        500
      );
    }
  }

  static async createProduct(c: Context<{ Bindings: Bindings }>) {
    try {
      const body = await c.req.json<CreateProductInput>();

      // 验证必填字段
      if (!body.name || !body.slug || !body.sku || !body.category_id || body.price === undefined) {
        return c.json(
          { success: false, error: '缺少必填字段: name, slug, sku, category_id, price' },
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

      const service = new ProductService(c.env.DB);
      const product = await service.createProduct(body);

      return c.json({ success: true, data: product }, 201);
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '创建产品失败' },
        400
      );
    }
  }

  static async updateProduct(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的产品ID' }, 400);
      }

      const body = await c.req.json<UpdateProductInput>();

      // 验证价格
      if (body.price !== undefined && body.price < 0) {
        return c.json(
          { success: false, error: '价格不能为负数' },
          400
        );
      }

      const service = new ProductService(c.env.DB);
      const product = await service.updateProduct(id, body);

      return c.json({ success: true, data: product });
    } catch (error: any) {
      const status = error.message === '产品不存在' ? 404 : 400;
      return c.json(
        { success: false, error: error.message || '更新产品失败' },
        status
      );
    }
  }

  static async deleteProduct(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的产品ID' }, 400);
      }

      const service = new ProductService(c.env.DB);
      await service.deleteProduct(id);

      return c.json({ success: true, message: '产品已删除' });
    } catch (error: any) {
      const status = error.message === '产品不存在' ? 404 : 400;
      return c.json(
        { success: false, error: error.message || '删除产品失败' },
        status
      );
    }
  }

  static async getFeaturedProducts(c: Context<{ Bindings: Bindings }>) {
    try {
      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10;
      const service = new ProductService(c.env.DB);
      const products = await service.getFeaturedProducts(limit);

      return c.json({ success: true, data: products });
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '获取推荐产品失败' },
        500
      );
    }
  }
}
