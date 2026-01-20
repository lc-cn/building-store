import { Notification, NotificationListQuery, SendNotificationRequest } from '../types';
import { replaceTemplateVariables } from '../utils/template';

export class NotificationService {
  constructor(private db: D1Database) {}

  /**
   * 发送通知
   */
  async send(request: SendNotificationRequest): Promise<Notification> {
    let content = request.content || '';
    let title = request.title;

    // 如果使用模板，则获取模板并替换变量
    if (request.template_code) {
      const template = await this.db
        .prepare('SELECT * FROM notification_templates WHERE code = ? AND status = ?')
        .bind(request.template_code, 'active')
        .first();

      if (!template) {
        throw new Error(`Template not found: ${request.template_code}`);
      }

      // 替换模板变量
      if (request.template_variables) {
        content = replaceTemplateVariables(
          template.content as string,
          request.template_variables
        );
        
        if (template.subject) {
          title = replaceTemplateVariables(
            template.subject as string,
            request.template_variables
          );
        }
      } else {
        content = template.content as string;
        title = template.subject as string;
      }
    }

    if (!content) {
      throw new Error('Content or template_code is required');
    }

    // 插入通知记录
    const result = await this.db
      .prepare(`
        INSERT INTO notifications (
          user_id, type, channel, title, content, data, 
          status, priority, recipient_email, recipient_phone, 
          recipient_device_token, reference_type, reference_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        request.user_id,
        request.type,
        request.channel || null,
        title || null,
        content,
        request.data ? JSON.stringify(request.data) : null,
        'pending',
        request.priority || 'normal',
        request.recipient_email || null,
        request.recipient_phone || null,
        request.recipient_device_token || null,
        request.reference_type || null,
        request.reference_id || null
      )
      .run();

    // 模拟发送（实际应该调用真实的发送服务）
    const notificationId = result.meta.last_row_id;
    await this.markAsSent(notificationId);

    return this.getById(notificationId);
  }

  /**
   * 获取通知列表
   */
  async list(query: NotificationListQuery): Promise<{
    items: Notification[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.user_id) {
      whereClause += ' AND user_id = ?';
      params.push(query.user_id);
    }

    if (query.type) {
      whereClause += ' AND type = ?';
      params.push(query.type);
    }

    if (query.status) {
      whereClause += ' AND status = ?';
      params.push(query.status);
    }

    if (query.priority) {
      whereClause += ' AND priority = ?';
      params.push(query.priority);
    }

    // 获取总数
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM notifications ${whereClause}`)
      .bind(...params)
      .first();

    const total = (countResult?.count as number) || 0;

    // 获取列表
    const items = await this.db
      .prepare(`
        SELECT * FROM notifications 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `)
      .bind(...params, limit, offset)
      .all();

    return {
      items: items.results as unknown as Notification[],
      total,
      page,
      limit,
    };
  }

  /**
   * 根据ID获取通知
   */
  async getById(id: number): Promise<Notification> {
    const notification = await this.db
      .prepare('SELECT * FROM notifications WHERE id = ?')
      .bind(id)
      .first();

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification as unknown as Notification;
  }

  /**
   * 标记为已读
   */
  async markAsRead(id: number): Promise<Notification> {
    await this.db
      .prepare(`
        UPDATE notifications 
        SET status = ?, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind('read', id)
      .run();

    return this.getById(id);
  }

  /**
   * 标记为已发送
   */
  private async markAsSent(id: number): Promise<void> {
    await this.db
      .prepare(`
        UPDATE notifications 
        SET status = ?, sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind('sent', id)
      .run();
  }

  /**
   * 标记为失败
   */
  async markAsFailed(id: number, errorMessage: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE notifications 
        SET status = ?, failed_at = CURRENT_TIMESTAMP, 
            error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      .bind('failed', errorMessage, id)
      .run();
  }
}
