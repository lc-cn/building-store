import { Context } from 'hono';
import { PreferenceService } from '../services/preference.service';
import { UpdatePreferenceRequest, Bindings } from '../types';

export class PreferenceHandler {
  /**
   * GET /preferences/:user_id - 获取用户通知偏好
   */
  static async get(c: Context<{ Bindings: Bindings }>) {
    try {
      const userId = parseInt(c.req.param('user_id'));

      if (isNaN(userId)) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      const service = new PreferenceService(c.env.DB);
      const preferences = await service.getByUserId(userId);

      return c.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get preferences',
        },
        500
      );
    }
  }

  /**
   * PUT /preferences/:user_id - 更新用户通知偏好
   */
  static async update(c: Context<{ Bindings: Bindings }>) {
    try {
      const userId = parseInt(c.req.param('user_id'));

      if (isNaN(userId)) {
        return c.json({ error: 'Invalid user ID' }, 400);
      }

      const body = await c.req.json();
      const service = new PreferenceService(c.env.DB);

      // 支持单个偏好更新或批量更新
      if (Array.isArray(body)) {
        // 批量更新
        const requests = body as UpdatePreferenceRequest[];
        
        // 验证每个请求
        for (const request of requests) {
          if (!request.notification_type) {
            return c.json({ error: 'notification_type is required for each preference' }, 400);
          }
        }

        const preferences = await service.bulkUpdate(userId, requests);

        return c.json({
          success: true,
          data: preferences,
        });
      } else {
        // 单个更新
        const request = body as UpdatePreferenceRequest;

        if (!request.notification_type) {
          return c.json({ error: 'notification_type is required' }, 400);
        }

        const preference = await service.upsert(userId, request);

        return c.json({
          success: true,
          data: preference,
        });
      }
    } catch (error) {
      console.error('Update preferences error:', error);
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update preferences',
        },
        500
      );
    }
  }
}
