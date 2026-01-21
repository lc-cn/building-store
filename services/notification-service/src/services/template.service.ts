import { NotificationTemplate, CreateTemplateRequest, UpdateTemplateRequest, TemplateListQuery } from '../types';

export class TemplateService {
  constructor(private db: D1Database) {}

  /**
   * 创建模板
   */
  async create(request: CreateTemplateRequest): Promise<NotificationTemplate> {
    const variables = request.variables ? JSON.stringify(request.variables) : null;

    const result = await this.db
      .prepare(`
        INSERT INTO notification_templates (
          code, name, type, subject, content, variables, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        request.code,
        request.name,
        request.type,
        request.subject || null,
        request.content,
        variables,
        request.status || 'active'
      )
      .run();

    return this.getById(result.meta.last_row_id);
  }

  /**
   * 获取模板列表
   */
  async list(query: TemplateListQuery): Promise<{
    items: NotificationTemplate[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (query.type) {
      whereClause += ' AND type = ?';
      params.push(query.type);
    }

    if (query.status) {
      whereClause += ' AND status = ?';
      params.push(query.status);
    }

    // 获取总数
    const countResult = await this.db
      .prepare(`SELECT COUNT(*) as count FROM notification_templates ${whereClause}`)
      .bind(...params)
      .first();

    const total = (countResult?.count as number) || 0;

    // 获取列表
    const items = await this.db
      .prepare(`
        SELECT * FROM notification_templates 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `)
      .bind(...params, limit, offset)
      .all();

    return {
      items: items.results as unknown as NotificationTemplate[],
      total,
      page,
      limit,
    };
  }

  /**
   * 根据ID获取模板
   */
  async getById(id: number): Promise<NotificationTemplate> {
    const template = await this.db
      .prepare('SELECT * FROM notification_templates WHERE id = ?')
      .bind(id)
      .first();

    if (!template) {
      throw new Error('Template not found');
    }

    return template as unknown as NotificationTemplate;
  }

  /**
   * 根据代码获取模板
   */
  async getByCode(code: string): Promise<NotificationTemplate | null> {
    const template = await this.db
      .prepare('SELECT * FROM notification_templates WHERE code = ?')
      .bind(code)
      .first();

    return template as NotificationTemplate | null;
  }

  /**
   * 更新模板
   */
  async update(id: number, request: UpdateTemplateRequest): Promise<NotificationTemplate> {
    const existing = await this.getById(id);

    const updates: string[] = [];
    const params: any[] = [];

    if (request.name !== undefined) {
      updates.push('name = ?');
      params.push(request.name);
    }

    if (request.type !== undefined) {
      updates.push('type = ?');
      params.push(request.type);
    }

    if (request.subject !== undefined) {
      updates.push('subject = ?');
      params.push(request.subject);
    }

    if (request.content !== undefined) {
      updates.push('content = ?');
      params.push(request.content);
    }

    if (request.variables !== undefined) {
      updates.push('variables = ?');
      params.push(JSON.stringify(request.variables));
    }

    if (request.status !== undefined) {
      updates.push('status = ?');
      params.push(request.status);
    }

    if (updates.length === 0) {
      return existing;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await this.db
      .prepare(`
        UPDATE notification_templates 
        SET ${updates.join(', ')} 
        WHERE id = ?
      `)
      .bind(...params)
      .run();

    return this.getById(id);
  }

  /**
   * 删除模板
   */
  async delete(id: number): Promise<void> {
    const existing = await this.getById(id);
    
    await this.db
      .prepare('DELETE FROM notification_templates WHERE id = ?')
      .bind(id)
      .run();
  }
}
