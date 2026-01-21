// 角色业务逻辑层

import { Role, CreateRoleInput, UpdateRoleInput } from '../types';

export class RoleService {
  constructor(private db: D1Database) {}

  async createRole(input: CreateRoleInput): Promise<Role> {
    const result = await this.db.prepare(`
      INSERT INTO roles (name, display_name, description)
      VALUES (?, ?, ?)
      RETURNING *
    `).bind(
      input.name,
      input.display_name,
      input.description || null
    ).first<Role>();

    if (!result) {
      throw new Error('Failed to create role');
    }

    return result;
  }

  async getRoleById(id: number): Promise<Role | null> {
    const role = await this.db.prepare(`
      SELECT * FROM roles WHERE id = ?
    `).bind(id).first<Role>();

    return role;
  }

  async getRoles(page: number = 1, limit: number = 50): Promise<{ roles: Role[], total: number }> {
    const offset = (page - 1) * limit;
    
    const roles = await this.db.prepare(`
      SELECT * FROM roles
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<Role>();

    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM roles
    `).first<{ count: number }>();

    return {
      roles: roles.results || [],
      total: countResult?.count || 0
    };
  }

  async updateRole(id: number, input: UpdateRoleInput): Promise<Role> {
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
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await this.db.prepare(`
      UPDATE roles SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING *
    `).bind(...values).first<Role>();

    if (!result) {
      throw new Error('Failed to update role');
    }

    return result;
  }

  async deleteRole(id: number): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM roles WHERE id = ?
    `).bind(id).run();

    return result.success;
  }

  async getRolePermissions(roleId: number): Promise<number[]> {
    const result = await this.db.prepare(`
      SELECT permission_id FROM role_permissions WHERE role_id = ?
    `).bind(roleId).all<{ permission_id: number }>();

    return result.results?.map(r => r.permission_id) || [];
  }
}
