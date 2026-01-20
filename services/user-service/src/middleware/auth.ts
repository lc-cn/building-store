// 认证和授权中间件

import { Context, Next } from 'hono';
import { verifyToken } from '../utils/crypto';
import { Bindings, JWTPayload } from '../types';

/**
 * JWT 认证中间件
 */
export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authorization = c.req.header('Authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ error: '未提供认证令牌' }, 401);
  }
  
  const token = authorization.substring(7);
  
  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET || 'default-secret');
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: '无效的认证令牌' }, 401);
  }
}

/**
 * 权限检查中间件工厂函数
 */
export function requirePermission(permission: string) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user') as JWTPayload;
    
    if (!user) {
      return c.json({ error: '未认证' }, 401);
    }
    
    if (!user.permissions || !user.permissions.includes(permission)) {
      return c.json({ error: '权限不足' }, 403);
    }
    
    await next();
  };
}

/**
 * 角色检查中间件工厂函数
 */
export function requireRole(role: string) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) {
    const user = c.get('user') as JWTPayload;
    
    if (!user) {
      return c.json({ error: '未认证' }, 401);
    }
    
    if (!user.roles || !user.roles.includes(role)) {
      return c.json({ error: '角色权限不足' }, 403);
    }
    
    await next();
  };
}

/**
 * 检查是否为超级管理员
 */
export function requireSuperAdmin() {
  return requireRole('super_admin');
}
