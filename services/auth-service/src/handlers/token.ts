// 令牌处理器

import type { Context } from 'hono';
import type { 
  Env, 
  TokenRequest, 
  TokenResponse,
  ApiResponse,
  RevokeTokenRequest,
  VerifyTokenRequest,
  VerifyTokenResponse
} from '../types';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
  decodeJWT
} from '../services/jwt';
import { createSession } from '../services/session';
import { verifyPassword } from '../utils/crypto';
import { validateRequired } from '../utils/validation';

/**
 * 生成令牌
 * POST /token
 */
export async function generateToken(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<TokenRequest>();
    
    // 验证必填字段
    const validation = validateRequired(body, ['grantType']);
    if (!validation.valid) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Missing required fields',
          details: validation.missing
        },
        timestamp: Date.now()
      }, 400);
    }
    
    let userId: string;
    let email: string | undefined;
    let roles: string[] | undefined;
    let sessionId: string | undefined;
    
    // 根据 grant type 处理
    switch (body.grantType) {
      case 'password':
        // 密码模式
        if (!body.username || !body.password) {
          return c.json<ApiResponse>({
            success: false,
            error: {
              code: 'invalid_request',
              message: 'Username and password required for password grant'
            },
            timestamp: Date.now()
          }, 400);
        }
        
        // 这里应该调用用户服务验证用户名和密码
        // 简化示例：模拟用户验证
        const user = await validateUserCredentials(body.username, body.password, c.env);
        if (!user) {
          return c.json<ApiResponse>({
            success: false,
            error: {
              code: 'invalid_credentials',
              message: 'Invalid username or password'
            },
            timestamp: Date.now()
          }, 401);
        }
        
        userId = user.userId;
        email = user.email;
        roles = user.roles;
        
        // 创建会话
        const session = await createSession(
          userId,
          email,
          c.req.header('CF-Connecting-IP'),
          c.req.header('User-Agent'),
          undefined,
          c.env
        );
        sessionId = session.sessionId;
        break;
        
      case 'refresh_token':
        // 刷新令牌模式
        if (!body.refreshToken) {
          return c.json<ApiResponse>({
            success: false,
            error: {
              code: 'invalid_request',
              message: 'Refresh token required'
            },
            timestamp: Date.now()
          }, 400);
        }
        
        const refreshResult = await verifyRefreshToken(body.refreshToken, c.env);
        if (!refreshResult.valid || !refreshResult.payload) {
          return c.json<ApiResponse>({
            success: false,
            error: {
              code: 'invalid_grant',
              message: refreshResult.error || 'Invalid refresh token'
            },
            timestamp: Date.now()
          }, 401);
        }
        
        userId = refreshResult.payload.sub;
        email = refreshResult.payload.email;
        roles = refreshResult.payload.roles;
        sessionId = refreshResult.payload.sessionId;
        break;
        
      default:
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'unsupported_grant_type',
            message: `Unsupported grant type: ${body.grantType}`
          },
          timestamp: Date.now()
        }, 400);
    }
    
    // 生成新令牌
    const accessToken = await generateAccessToken(userId, email, roles, sessionId, c.env);
    const refreshToken = await generateRefreshToken(userId, sessionId, c.env);
    
    const response: TokenResponse = {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: 900, // 15分钟
      scope: body.scope
    };
    
    return c.json<ApiResponse<TokenResponse>>({
      success: true,
      data: response,
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
}

/**
 * 刷新令牌
 * POST /token/refresh
 */
export async function refreshToken(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<{ refreshToken: string }>();
    
    if (!body.refreshToken) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Refresh token required'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    const result = await verifyRefreshToken(body.refreshToken, c.env);
    
    if (!result.valid || !result.payload) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_grant',
          message: result.error || 'Invalid refresh token'
        },
        timestamp: Date.now()
      }, 401);
    }
    
    // 生成新令牌
    const accessToken = await generateAccessToken(
      result.payload.sub,
      result.payload.email,
      result.payload.roles,
      result.payload.sessionId,
      c.env
    );
    
    const response: TokenResponse = {
      accessToken,
      refreshToken: body.refreshToken, // 可以选择返回新的刷新令牌
      tokenType: 'Bearer',
      expiresIn: 900
    };
    
    return c.json<ApiResponse<TokenResponse>>({
      success: true,
      data: response,
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
}

/**
 * 撤销令牌
 * POST /token/revoke
 */
export async function revokeToken(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<RevokeTokenRequest>();
    
    if (!body.token) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Token required'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 撤销刷新令牌
    const revoked = await revokeRefreshToken(body.token, c.env);
    
    return c.json<ApiResponse>({
      success: true,
      data: { revoked },
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
}

/**
 * 验证令牌
 * POST /token/verify
 */
export async function verifyToken(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<VerifyTokenRequest>();
    
    if (!body.token) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Token required'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    const result = await verifyAccessToken(body.token, c.env);
    
    const response: VerifyTokenResponse = {
      valid: result.valid,
      payload: result.payload,
      error: result.error
    };
    
    return c.json<ApiResponse<VerifyTokenResponse>>({
      success: true,
      data: response,
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
}

/**
 * 验证用户凭证（辅助函数）
 * 实际应用中应该调用用户服务
 */
async function validateUserCredentials(
  username: string,
  password: string,
  env: Env
): Promise<{ userId: string; email: string; roles?: string[] } | null> {
  // 这里应该调用用户服务 API 验证用户名和密码
  // 简化示例：从 KV 获取用户信息
  const userKey = `user:${username}`;
  const userData = await env.AUTH_KV.get(userKey);
  
  if (!userData) {
    return null;
  }
  
  const user = JSON.parse(userData);
  
  // 验证密码
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }
  
  return {
    userId: user.userId,
    email: user.email,
    roles: user.roles
  };
}
