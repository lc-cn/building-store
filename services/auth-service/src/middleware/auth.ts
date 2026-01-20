// 认证中间件

import type { Context, Next } from 'hono';
import type { Env, JWTPayload } from '../types';
import { verifyAccessToken } from '../services/jwt';

// 扩展 Context 类型以包含用户信息
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

/**
 * JWT 认证中间件
 */
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({
      success: false,
      error: {
        code: 'unauthorized',
        message: 'Missing authorization header'
      },
      timestamp: Date.now()
    }, 401);
  }
  
  // 验证 Bearer 格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return c.json({
      success: false,
      error: {
        code: 'invalid_token',
        message: 'Invalid authorization header format'
      },
      timestamp: Date.now()
    }, 401);
  }
  
  const token = parts[1];
  
  // 验证令牌
  const result = await verifyAccessToken(token, c.env);
  
  if (!result.valid || !result.payload) {
    return c.json({
      success: false,
      error: {
        code: 'invalid_token',
        message: result.error || 'Invalid or expired token'
      },
      timestamp: Date.now()
    }, 401);
  }
  
  // 将用户信息存储到上下文
  c.set('user', result.payload);
  
  await next();
}

/**
 * 可选认证中间件（令牌可选）
 */
export async function optionalAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const result = await verifyAccessToken(token, c.env);
      
      if (result.valid && result.payload) {
        c.set('user', result.payload);
      }
    }
  }
  
  await next();
}

/**
 * 角色验证中间件
 */
export function requireRole(...roles: string[]) {
  return async (c: Context<{ Bindings: Env }>, next: Next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({
        success: false,
        error: {
          code: 'unauthorized',
          message: 'Authentication required'
        },
        timestamp: Date.now()
      }, 401);
    }
    
    const userRoles = user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRole) {
      return c.json({
        success: false,
        error: {
          code: 'forbidden',
          message: 'Insufficient permissions'
        },
        timestamp: Date.now()
      }, 403);
    }
    
    await next();
  };
}

/**
 * 客户端认证中间件（用于 OAuth）
 */
export async function clientAuthMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader) {
    return c.json({
      success: false,
      error: {
        code: 'invalid_client',
        message: 'Missing client credentials'
      },
      timestamp: Date.now()
    }, 401);
  }
  
  // 支持 Basic Auth 格式
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Basic') {
    return c.json({
      success: false,
      error: {
        code: 'invalid_client',
        message: 'Invalid authorization header format'
      },
      timestamp: Date.now()
    }, 401);
  }
  
  try {
    const decoded = atob(parts[1]);
    const [clientId, clientSecret] = decoded.split(':');
    
    // 将客户端凭证存储到上下文
    c.set('clientId' as any, clientId);
    c.set('clientSecret' as any, clientSecret);
    
    await next();
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'invalid_client',
        message: 'Invalid client credentials'
      },
      timestamp: Date.now()
    }, 401);
  }
}

/**
 * CORS 中间件
 */
export async function corsMiddleware(c: Context, next: Next) {
  // 设置 CORS 头
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');
  
  // 处理 OPTIONS 预检请求
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }
  
  await next();
}

/**
 * 错误处理中间件
 */
export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Error:', error);
    
    return c.json({
      success: false,
      error: {
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      timestamp: Date.now()
    }, 500);
  }
}

/**
 * 请求日志中间件
 */
export async function logMiddleware(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  
  await next();
  
  const duration = Date.now() - start;
  console.log(`${method} ${path} - ${c.res.status} - ${duration}ms`);
}
