// 认证服务主入口

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, ApiResponse, Session } from './types';

// 导入处理器
import { generateToken, refreshToken, revokeToken, verifyToken } from './handlers/token';
import { authorize, token as oauthToken } from './handlers/oauth';
import {
  requestPasswordReset,
  verifyPasswordResetToken,
  confirmPasswordReset
} from './handlers/password';

// 导入中间件
import {
  authMiddleware,
  corsMiddleware,
  errorMiddleware,
  logMiddleware
} from './middleware/auth';

// 导入服务
import { getSession, deleteSession } from './services/session';

const app = new Hono<{ Bindings: Env }>();

// 全局中间件
app.use('*', corsMiddleware);
app.use('*', logMiddleware);
app.use('*', errorMiddleware);

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'auth-service',
    runtime: 'cloudflare-workers',
    timestamp: Date.now()
  });
});

// 根路由 - 服务信息
app.get('/', (c) => {
  return c.json({
    service: '认证服务',
    version: '0.1.0',
    description: 'JWT令牌管理、OAuth2.0、单点登录(SSO)、密码重置',
    runtime: 'Cloudflare Workers',
    endpoints: {
      token: {
        generate: 'POST /token',
        refresh: 'POST /token/refresh',
        revoke: 'POST /token/revoke',
        verify: 'POST /token/verify'
      },
      oauth: {
        authorize: 'POST /oauth/authorize',
        token: 'POST /oauth/token'
      },
      password: {
        reset: 'POST /password/reset',
        verify: 'POST /password/reset/verify',
        confirm: 'POST /password/reset/confirm'
      },
      session: {
        get: 'GET /session/:sessionId',
        delete: 'DELETE /session/:sessionId'
      }
    },
    timestamp: Date.now()
  });
});

// ========== 令牌管理路由 ==========

/**
 * 生成令牌
 * 支持多种 grant type: password, refresh_token, client_credentials
 */
app.post('/token', generateToken);

/**
 * 刷新令牌
 * 使用刷新令牌获取新的访问令牌
 */
app.post('/token/refresh', refreshToken);

/**
 * 撤销令牌
 * 撤销刷新令牌，使其失效
 */
app.post('/token/revoke', revokeToken);

/**
 * 验证令牌
 * 验证访问令牌的有效性
 */
app.post('/token/verify', verifyToken);

// ========== OAuth 2.0 路由 ==========

/**
 * OAuth 授权端点
 * 生成授权码（授权码模式）
 */
app.post('/oauth/authorize', authorize);

/**
 * OAuth 令牌端点
 * 交换授权码获取令牌或使用客户端凭证获取令牌
 */
app.post('/oauth/token', oauthToken);

// ========== 密码重置路由 ==========

/**
 * 请求密码重置
 * 发送密码重置邮件（生成重置令牌）
 */
app.post('/password/reset', requestPasswordReset);

/**
 * 验证重置令牌
 * 检查重置令牌是否有效
 */
app.post('/password/reset/verify', verifyPasswordResetToken);

/**
 * 确认密码重置
 * 使用重置令牌设置新密码
 */
app.post('/password/reset/confirm', confirmPasswordReset);

// ========== 会话管理路由 ==========

/**
 * 获取会话信息
 * 需要认证
 */
app.get('/session/:sessionId', authMiddleware, async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const session = await getSession(sessionId, c.env);
    
    if (!session) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'session_not_found',
          message: 'Session not found or expired'
        },
        timestamp: Date.now()
      }, 404);
    }
    
    // 验证用户只能访问自己的会话
    const user = c.get('user');
    if (user.sub !== session.userId) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'forbidden',
          message: 'Access denied to this session'
        },
        timestamp: Date.now()
      }, 403);
    }
    
    return c.json<ApiResponse<Session>>({
      success: true,
      data: session,
      timestamp: Date.now()
    });
    
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: Date.now()
    }, 500);
  }
});

/**
 * 删除会话（登出）
 * 需要认证
 */
app.delete('/session/:sessionId', authMiddleware, async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    const session = await getSession(sessionId, c.env);
    
    if (!session) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'session_not_found',
          message: 'Session not found'
        },
        timestamp: Date.now()
      }, 404);
    }
    
    // 验证用户只能删除自己的会话
    const user = c.get('user');
    if (user.sub !== session.userId) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'forbidden',
          message: 'Access denied to this session'
        },
        timestamp: Date.now()
      }, 403);
    }
    
    const deleted = await deleteSession(sessionId, c.env);
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        deleted,
        message: 'Session deleted successfully'
      },
      timestamp: Date.now()
    });
    
  } catch (error) {
    return c.json<ApiResponse>({
      success: false,
      error: {
        code: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: Date.now()
    }, 500);
  }
});

// ========== 管理端点 ==========

/**
 * 获取当前认证用户信息
 * 需要认证
 */
app.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  
  return c.json<ApiResponse>({
    success: true,
    data: {
      userId: user.sub,
      email: user.email,
      roles: user.roles,
      sessionId: user.sessionId,
      tokenType: user.type,
      issuedAt: user.iat,
      expiresAt: user.exp
    },
    timestamp: Date.now()
  });
});

// 404 处理
app.notFound((c) => {
  return c.json<ApiResponse>({
    success: false,
    error: {
      code: 'not_found',
      message: 'Endpoint not found'
    },
    timestamp: Date.now()
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  
  return c.json<ApiResponse>({
    success: false,
    error: {
      code: 'internal_error',
      message: err.message || 'Internal server error'
    },
    timestamp: Date.now()
  }, 500);
});

export default app;
