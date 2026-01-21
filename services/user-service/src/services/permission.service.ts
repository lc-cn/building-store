// 权限业务逻辑层

import { Permission } from '../types';

export class PermissionService {
  constructor(private db: D1Database) {}

  async createPermission(input: { name: string, display_name: string, resource: string, action: string, description?: string }): Promise<Permission> {
    const result = await this.db.prepare(`
      INSERT INTO permissions (name, display_name, resource, action, description)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      input.name,
      input.display_name,
      input.resource,
      input.action,
      input.description || null
    ).first<Permission>();

    if (!result) {
      throw new Error('Failed to create permission');
    }

    return result;
  }

  async getPermissionById(id: number): Promise<Permission | null> {
    const permission = await this.db.prepare(`
      SELECT * FROM permissions WHERE id = ?
    `).bind(id).first<Permission>();

    return permission;
  }

  async getPermissions(page: number = 1, limit: number = 100): Promise<{ permissions: Permission[], total: number }> {
    const offset = (page - 1) * limit;
    
    const permissions = await this.db.prepare(`
      SELECT * FROM permissions
      ORDER BY resource, action
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<Permission>();

    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM permissions
    `).first<{ count: number }>();

    return {
      permissions: permissions.results || [],
      total: countResult?.count || 0
    };
  }

  async updatePermission(id: number, input: Partial<Permission>): Promise<Permission> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(input.display_name);
    }
    if (input.resource !== undefined) {
      updates.push('resource = ?');
      values.push(input.resource);
    }
    if (input.action !== undefined) {
      updates.push('action = ?');
      values.push(input.action);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await this.db.prepare(`
      UPDATE permissions SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).bind(...values).first<Permission>();

    if (!result) {
      throw new Error('Failed to update permission');
    }

    return result;
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM permissions WHERE id = ?
    `).bind(id).run();

    return result.success;
  }
}
