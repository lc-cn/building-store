import { Context } from 'hono';
import { TemplateService } from '../services/template.service';
import { CreateTemplateRequest, UpdateTemplateRequest, TemplateListQuery, Bindings } from '../types';

export class TemplateHandler {
  /**
   * GET /templates - 获取模板列表
   */
  static async list(c: Context<{ Bindings: Bindings }>) {
    try {
      const query: TemplateListQuery = {
        type: c.req.query('type') as any,
        status: c.req.query('status') as any,
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : 1,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20,
      };

      const service = new TemplateService(c.env.DB);
      const result = await service.list(query);

      return c.json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          total_pages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error) {
      console.error('List templates error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list templates',
        },
        500
      );
    }
  }

  /**
   * POST /templates - 创建模板
   */
  static async create(c: Context<{ Bindings: Bindings }>) {
    try {
      const request = await c.req.json<CreateTemplateRequest>();

      // 验证必填字段
      if (!request.code) {
        return c.json({ error: 'code is required' }, 400);
      }

      if (!request.name) {
        return c.json({ error: 'name is required' }, 400);
      }

      if (!request.type) {
        return c.json({ error: 'type is required' }, 400);
      }

      if (!request.content) {
        return c.json({ error: 'content is required' }, 400);
      }

      const service = new TemplateService(c.env.DB);
      
      // 检查代码是否已存在
      const existing = await service.getByCode(request.code);
      if (existing) {
        return c.json({ error: 'Template code already exists' }, 409);
      }

      const template = await service.create(request);

      return c.json({
        success: true,
        data: template,
      }, 201);
    } catch (error) {
      console.error('Create template error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create template',
        },
        500
      );
    }
  }

  /**
   * GET /templates/:id - 获取模板详情
   */
  static async get(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid template ID' }, 400);
      }

      const service = new TemplateService(c.env.DB);
      const template = await service.getById(id);

      return c.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Get template error:', error);
      
      if (error instanceof Error && error.message === 'Template not found') {
        return c.json({ success: false, error: error.message }, 404);
      }

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get template',
        },
        500
      );
    }
  }

  /**
   * PUT /templates/:id - 更新模板
   */
  static async update(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid template ID' }, 400);
      }

      const request = await c.req.json<UpdateTemplateRequest>();

      const service = new TemplateService(c.env.DB);
      const template = await service.update(id, request);

      return c.json({
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Update template error:', error);
      
      if (error instanceof Error && error.message === 'Template not found') {
        return c.json({ success: false, error: error.message }, 404);
      }

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update template',
        },
        500
      );
    }
  }

  /**
   * DELETE /templates/:id - 删除模板
   */
  static async delete(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid template ID' }, 400);
      }

      const service = new TemplateService(c.env.DB);
      await service.delete(id);

      return c.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Delete template error:', error);
      
      if (error instanceof Error && error.message === 'Template not found') {
        return c.json({ success: false, error: error.message }, 404);
      }

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to delete template',
        },
        500
      );
    }
  }
}
