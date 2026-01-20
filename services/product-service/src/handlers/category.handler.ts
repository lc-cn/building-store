import { Context } from 'hono';
import { CategoryService } from '../services/category.service';
import type { Bindings, CreateCategoryInput, UpdateCategoryInput } from '../types';

export class CategoryHandler {
  static async getCategories(c: Context<{ Bindings: Bindings }>) {
    try {
      const service = new CategoryService(c.env.DB);
      const parentId = c.req.query('parent_id');
      const tree = c.req.query('tree');

      if (tree === 'true') {
        const categories = await service.getCategoryTree();
        return c.json({ success: true, data: categories });
      }

      const categories = await service.getAllCategories(
        parentId ? parseInt(parentId) : undefined
      );

      return c.json({ success: true, data: categories });
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '获取分类失败' },
        500
      );
    }
  }

  static async getCategoryById(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的分类ID' }, 400);
      }

      const service = new CategoryService(c.env.DB);
      const category = await service.getCategoryById(id);

      if (!category) {
        return c.json({ success: false, error: '分类不存在' }, 404);
      }

      return c.json({ success: true, data: category });
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '获取分类失败' },
        500
      );
    }
  }

  static async createCategory(c: Context<{ Bindings: Bindings }>) {
    try {
      const body = await c.req.json<CreateCategoryInput>();

      // 验证必填字段
      if (!body.name || !body.slug) {
        return c.json(
          { success: false, error: '缺少必填字段: name, slug' },
          400
        );
      }

      const service = new CategoryService(c.env.DB);
      const category = await service.createCategory(body);

      return c.json({ success: true, data: category }, 201);
    } catch (error: any) {
      return c.json(
        { success: false, error: error.message || '创建分类失败' },
        400
      );
    }
  }

  static async updateCategory(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的分类ID' }, 400);
      }

      const body = await c.req.json<UpdateCategoryInput>();
      const service = new CategoryService(c.env.DB);
      const category = await service.updateCategory(id, body);

      return c.json({ success: true, data: category });
    } catch (error: any) {
      const status = error.message === '分类不存在' ? 404 : 400;
      return c.json(
        { success: false, error: error.message || '更新分类失败' },
        status
      );
    }
  }

  static async deleteCategory(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({ success: false, error: '无效的分类ID' }, 400);
      }

      const service = new CategoryService(c.env.DB);
      await service.deleteCategory(id);

      return c.json({ success: true, message: '分类已删除' });
    } catch (error: any) {
      const status = error.message === '分类不存在' ? 404 : 400;
      return c.json(
        { success: false, error: error.message || '删除分类失败' },
        status
      );
    }
  }
}
