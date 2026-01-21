/**
 * 认证中间件
 */

import { Context, Next } from 'hono';
import { Env, JWTPayload, AuthType } from '../types';
import { RouterService } from '../services/router';

/**
 * JWT认证中间件
 */
export function jwtAuth() {
  return async (c: Context, next: Next) => {
    const env = c.env as Env;
    const router = new RouterService(env);
    
    // 获取路由配置
    const routeConfig = await router.matchRoute(c.req.path, c.req.method);
    
    // 如果不需要认证，跳过
    if (!routeConfig?.authentication.required || 
        routeConfig.authentication.type === AuthType.NONE) {
      return next();
    }

    // JWT认证
    if (routeConfig.authentication.type === AuthType.JWT) {
      const token = extractToken(c.req);
      
      if (!token) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '缺少认证令牌',
          },
        }, 401);
      }

      try {
        const payload = await verifyJWT(token, env.JWT_SECRET);
        
        // 检查角色权限
        if (routeConfig.authentication.roles && routeConfig.authentication.roles.length > 0) {
          if (!payload.roles || !hasRequiredRole(payload.roles, routeConfig.authentication.roles)) {
            return c.json({
              success: false,
              error: {
                code: 'FORBIDDEN',
                message: '权限不足',
              },
            }, 403);
          }
        }
      } catch (error) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '无效的认证令牌',
            details: error instanceof Error ? error.message : undefined,
          },
        }, 401);
      }
    }

    // API Key认证
    if (routeConfig.authentication.type === AuthType.API_KEY) {
      const apiKey = c.req.header('X-API-Key');
      
      if (!apiKey) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '缺少API密钥',
          },
        }, 401);
      }

      if (!await verifyApiKey(apiKey, env)) {
        return c.json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: '无效的API密钥',
          },
        }, 401);
      }
    }

    await next();
  };
}

/**
 * 管理员认证中间件
 */
export function adminAuth() {
  return async (c: Context, next: Next) => {
    const env = c.env as Env;
    const apiKey = c.req.header('X-Admin-Key');
    
    if (!apiKey || apiKey !== env.ADMIN_API_KEY) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '管理员权限验证失败',
        },
      }, 403);
    }

    await next();
  };
}

/**
 * 提取JWT令牌
 */
function extractToken(req: any): string | null {
  const authHeader = req.header('Authorization');
  
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * 验证JWT令牌
 */
async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  try {
    // 分割JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('无效的JWT格式');
    }

    // 解码payload
    const payload = JSON.parse(atob(parts[1]));

    // 检查过期时间
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('令牌已过期');
    }

    // 验证签名（简化版本，实际应该使用crypto库）
    const signature = await signJWT(parts[0] + '.' + parts[1], secret);
    if (signature !== parts[2]) {
      throw new Error('签名验证失败');
    }

    return payload;
  } catch (error) {
    throw new Error(`JWT验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 签名JWT（简化版本）
 */
async function signJWT(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 检查是否有必需的角色
 */
function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  return requiredRoles.some(role => userRoles.includes(role));
}

/**
 * 验证API密钥
 */
async function verifyApiKey(apiKey: string, env: Env): Promise<boolean> {
  // 这里应该从KV或数据库验证API密钥
  // 简化版本：仅检查是否为管理员密钥
  return apiKey === env.ADMIN_API_KEY;
}
