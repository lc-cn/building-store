// 用户业务逻辑层

import { Bindings, User, CreateUserInput, UpdateUserInput } from '../types';
import { hashPassword } from '../utils/crypto';

export class UserService {
  constructor(private db: D1Database) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const passwordHash = await hashPassword(input.password);
    
    const result = await this.db.prepare(`
      INSERT INTO users (username, email, password_hash, phone, avatar_url)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *
    `).bind(
      input.username,
      input.email,
      passwordHash,
      input.phone || null,
      input.avatar_url || null
    ).first<User>();

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result;
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.db.prepare(`
      SELECT id, username, email, phone, avatar_url, status, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(id).first<User>();

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.db.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first<User>();

    return user;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const user = await this.db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).bind(username).first<User>();

    return user;
  }

  async getUsers(page: number = 1, limit: number = 10): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    const users = await this.db.prepare(`
      SELECT id, username, email, phone, avatar_url, status, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(limit, offset).all<User>();

    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM users
    `).first<{ count: number }>();

    return {
      users: users.results || [],
      total: countResult?.count || 0
    };
  }

  async updateUser(id: number, input: UpdateUserInput): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];

    if (input.username !== undefined) {
      updates.push('username = ?');
      values.push(input.username);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      values.push(input.email);
    }
    if (input.password !== undefined) {
      updates.push('password_hash = ?');
      values.push(await hashPassword(input.password));
    }
    if (input.phone !== undefined) {
      updates.push('phone = ?');
      values.push(input.phone);
    }
    if (input.avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(input.avatar_url);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await this.db.prepare(`
      UPDATE users SET ${updates.join(', ')}
      WHERE id = ?
      RETURNING id, username, email, phone, avatar_url, status, created_at, updated_at
    `).bind(...values).first<User>();

    if (!result) {
      throw new Error('Failed to update user');
    }

    return result;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM users WHERE id = ?
    `).bind(id).run();

    return result.success;
  }

  async getUserRoles(userId: number): Promise<string[]> {
    const result = await this.db.prepare(`
      SELECT r.name
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ? AND r.status = 'active'
    `).bind(userId).all<{ name: string }>();

    return result.results?.map(r => r.name) || [];
  }

  async getUserPermissions(userId: number): Promise<string[]> {
    const result = await this.db.prepare(`
      SELECT DISTINCT p.name
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `).bind(userId).all<{ name: string }>();

    return result.results?.map(p => p.name) || [];
  }
}
