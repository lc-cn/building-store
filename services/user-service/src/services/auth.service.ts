// 认证业务逻辑层

import { Bindings, JWTPayload } from '../types';
import { verifyPassword, generateToken } from '../utils/crypto';
import { UserService } from './user.service';

export class AuthService {
  private userService: UserService;

  constructor(private db: D1Database, private jwtSecret: string) {
    this.userService = new UserService(db);
  }

  async login(email: string, password: string): Promise<{ token: string, user: any }> {
    const user = await this.userService.getUserByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (user.status !== 'active') {
      throw new Error('User account is not active');
    }

    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const roles = await this.userService.getUserRoles(user.id);
    const permissions = await this.userService.getUserPermissions(user.id);

    const payload: Omit<JWTPayload, 'exp' | 'iat'> = {
      user_id: user.id,
      username: user.username,
      email: user.email,
      roles,
      permissions
    };

    const token = await generateToken(payload, this.jwtSecret, 86400);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar_url: user.avatar_url,
        status: user.status,
        roles,
        permissions
      }
    };
  }

  async assignRoleToUser(userId: number, roleId: number): Promise<boolean> {
    const result = await this.db.prepare(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id)
      VALUES (?, ?)
    `).bind(userId, roleId).run();

    return result.success;
  }

  async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM user_roles WHERE user_id = ? AND role_id = ?
    `).bind(userId, roleId).run();

    return result.success;
  }

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<boolean> {
    const result = await this.db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
    `).bind(roleId, permissionId).run();

    return result.success;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    const result = await this.db.prepare(`
      DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?
    `).bind(roleId, permissionId).run();

    return result.success;
  }
}
