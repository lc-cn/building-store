import { Context } from 'hono';
import { NotificationService } from '../services/notification.service';
import { SendNotificationRequest, NotificationListQuery, Bindings } from '../types';

export class NotificationHandler {
  /**
   * POST /notifications/send - 发送通知
   */
  static async send(c: Context<{ Bindings: Bindings }>) {
    try {
      const request = await c.req.json<SendNotificationRequest>();

      // 验证必填字段
      if (!request.user_id) {
        return c.json({ error: 'user_id is required' }, 400);
      }

      if (!request.type) {
        return c.json({ error: 'type is required' }, 400);
      }

      if (!request.content && !request.template_code) {
        return c.json({ error: 'content or template_code is required' }, 400);
      }

      const service = new NotificationService(c.env.DB);
      const notification = await service.send(request);

      return c.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Send notification error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to send notification',
        },
        500
      );
    }
  }

  /**
   * GET /notifications - 获取通知列表
   */
  static async list(c: Context<{ Bindings: Bindings }>) {
    try {
      const query: NotificationListQuery = {
        user_id: c.req.query('user_id') ? parseInt(c.req.query('user_id')!) : undefined,
        type: c.req.query('type') as any,
        status: c.req.query('status') as any,
        priority: c.req.query('priority') as any,
        page: c.req.query('page') ? parseInt(c.req.query('page')!) : 1,
        limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 20,
      };

      const service = new NotificationService(c.env.DB);
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
      console.error('List notifications error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to list notifications',
        },
        500
      );
    }
  }

  /**
   * GET /notifications/:id - 获取通知详情
   */
  static async get(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid notification ID' }, 400);
      }

      const service = new NotificationService(c.env.DB);
      const notification = await service.getById(id);

      return c.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Get notification error:', error);
      
      if (error instanceof Error && error.message === 'Notification not found') {
        return c.json({ success: false, error: error.message }, 404);
      }

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get notification',
        },
        500
      );
    }
  }

  /**
   * PUT /notifications/:id/read - 标记为已读
   */
  static async markAsRead(c: Context<{ Bindings: Bindings }>) {
    try {
      const id = parseInt(c.req.param('id'));

      if (isNaN(id)) {
        return c.json({ error: 'Invalid notification ID' }, 400);
      }

      const service = new NotificationService(c.env.DB);
      const notification = await service.markAsRead(id);

      return c.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      console.error('Mark as read error:', error);
      
      if (error instanceof Error && error.message === 'Notification not found') {
        return c.json({ success: false, error: error.message }, 404);
      }

      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to mark as read',
        },
        500
      );
    }
  }
}
