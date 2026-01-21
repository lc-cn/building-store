import { NotificationPreference, UpdatePreferenceRequest } from '../types';

export class PreferenceService {
  constructor(private db: D1Database) {}

  /**
   * 获取用户的通知偏好列表
   */
  async getByUserId(userId: number): Promise<NotificationPreference[]> {
    const result = await this.db
      .prepare('SELECT * FROM notification_preferences WHERE user_id = ? ORDER BY notification_type')
      .bind(userId)
      .all();

    return result.results as unknown as NotificationPreference[];
  }

  /**
   * 获取用户特定类型的通知偏好
   */
  async getByUserIdAndType(userId: number, notificationType: string): Promise<NotificationPreference | null> {
    const preference = await this.db
      .prepare('SELECT * FROM notification_preferences WHERE user_id = ? AND notification_type = ?')
      .bind(userId, notificationType)
      .first();

    return preference as NotificationPreference | null;
  }

  /**
   * 更新或创建用户通知偏好
   */
  async upsert(userId: number, request: UpdatePreferenceRequest): Promise<NotificationPreference> {
    const existing = await this.getByUserIdAndType(userId, request.notification_type);

    if (existing) {
      // 更新现有偏好
      return this.update(existing.id, request);
    } else {
      // 创建新偏好
      return this.create(userId, request);
    }
  }

  /**
   * 创建通知偏好
   */
  private async create(userId: number, request: UpdatePreferenceRequest): Promise<NotificationPreference> {
    const result = await this.db
      .prepare(`
        INSERT INTO notification_preferences (
          user_id, notification_type, email_enabled, sms_enabled, 
          push_enabled, system_enabled
        ) VALUES (?, ?, ?, ?, ?, ?)
      `)
      .bind(
        userId,
        request.notification_type,
        request.email_enabled !== undefined ? request.email_enabled : true,
        request.sms_enabled !== undefined ? request.sms_enabled : false,
        request.push_enabled !== undefined ? request.push_enabled : true,
        request.system_enabled !== undefined ? request.system_enabled : true
      )
      .run();

    return this.getById(result.meta.last_row_id);
  }

  /**
   * 更新通知偏好
   */
  private async update(id: number, request: UpdatePreferenceRequest): Promise<NotificationPreference> {
    const updates: string[] = [];
    const params: any[] = [];

    if (request.email_enabled !== undefined) {
      updates.push('email_enabled = ?');
      params.push(request.email_enabled);
    }

    if (request.sms_enabled !== undefined) {
      updates.push('sms_enabled = ?');
      params.push(request.sms_enabled);
    }

    if (request.push_enabled !== undefined) {
      updates.push('push_enabled = ?');
      params.push(request.push_enabled);
    }

    if (request.system_enabled !== undefined) {
      updates.push('system_enabled = ?');
      params.push(request.system_enabled);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await this.db
        .prepare(`
          UPDATE notification_preferences 
          SET ${updates.join(', ')} 
          WHERE id = ?
        `)
        .bind(...params)
        .run();
    }

    return this.getById(id);
  }

  /**
   * 根据ID获取偏好
   */
  private async getById(id: number): Promise<NotificationPreference> {
    const preference = await this.db
      .prepare('SELECT * FROM notification_preferences WHERE id = ?')
      .bind(id)
      .first();

    if (!preference) {
      throw new Error('Preference not found');
    }

    return preference as unknown as NotificationPreference;
  }

  /**
   * 批量更新用户的通知偏好
   */
  async bulkUpdate(userId: number, requests: UpdatePreferenceRequest[]): Promise<NotificationPreference[]> {
    const results: NotificationPreference[] = [];

    for (const request of requests) {
      const result = await this.upsert(userId, request);
      results.push(result);
    }

    return results;
  }

  /**
   * 检查用户是否启用了特定类型和渠道的通知
   */
  async isEnabled(userId: number, notificationType: string, channel: 'email' | 'sms' | 'push' | 'system'): Promise<boolean> {
    const preference = await this.getByUserIdAndType(userId, notificationType);

    if (!preference) {
      // 如果没有偏好设置，使用默认值
      return channel === 'email' || channel === 'push' || channel === 'system';
    }

    switch (channel) {
      case 'email':
        return preference.email_enabled;
      case 'sms':
        return preference.sms_enabled;
      case 'push':
        return preference.push_enabled;
      case 'system':
        return preference.system_enabled;
      default:
        return true;
    }
  }
}
