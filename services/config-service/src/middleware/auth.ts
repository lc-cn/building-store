// 认证中间件

import type { Context, Next } from 'hono';
import type { Bindings, RequestContext } from '../types';

type AppContext = Context<{ Bindings: Bindings; Variables: { user?: { id: string; name: string; role: string } } }>;

/**
 * 简单的 API Key 认证中间件
 */
export async function authMiddleware(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader) {
    return c.json({ error: '缺少 Authorization 头' }, 401);
  }

  // 简单的 Bearer token 验证
  // 在生产环境中应该验证 JWT 或其他安全令牌
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return c.json({ error: '无效的 token' }, 401);
  }

  // 模拟用户信息（实际应该从 JWT 解析或数据库查询）
  // 这里简化处理，实际项目应该集成真实的认证系统
  const user = {
    id: 'user-' + token.substring(0, 8),
    name: token === 'admin-token' ? 'Admin' : 'User',
    role: token === 'admin-token' ? 'admin' : 'user',
  };

  // 将用户信息存储到上下文
  c.set('user', user);

  await next();
}

/**
 * 可选的认证中间件（允许匿名访问但会解析用户）
 */
export async function optionalAuthMiddleware(c: AppContext, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    if (token) {
      const user = {
        id: 'user-' + token.substring(0, 8),
        name: token === 'admin-token' ? 'Admin' : 'User',
        role: token === 'admin-token' ? 'admin' : 'user',
      };
      c.set('user', user);
    }
  }

  await next();
}

/**
 * 管理员权限检查中间件
 */
export async function requireAdmin(c: AppContext, next: Next) {
  const user = c.get('user');

  if (!user || user.role !== 'admin') {
    return c.json({ error: '需要管理员权限' }, 403);
  }

  await next();
}

/**
 * 获取请求者信息
 */
export function getOperator(c: Context): string {
  const user = c.get('user');
  return user ? user.name : 'anonymous';
}

/**
 * 获取客户端 IP
 */
export function getClientIP(c: Context): string {
  return c.req.header('CF-Connecting-IP') || 
         c.req.header('X-Forwarded-For') || 
         'unknown';
}
