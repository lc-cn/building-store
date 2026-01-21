// OAuth 处理器

import type { Context } from 'hono';
import type {
  Env,
  OAuthAuthorizeRequest,
  OAuthTokenRequest,
  ApiResponse,
  TokenResponse
} from '../types';
import {
  getOAuthClient,
  generateAuthorizationCode,
  validateRedirectUri,
  validateScope,
  exchangeAuthorizationCode,
  clientCredentialsGrant
} from '../services/oauth';
import { validateRequired } from '../utils/validation';

/**
 * OAuth 授权端点
 * POST /oauth/authorize
 */
export async function authorize(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<OAuthAuthorizeRequest>();
    
    // 验证必填字段
    const validation = validateRequired(body, [
      'responseType',
      'clientId',
      'redirectUri',
      'userId'
    ]);
    
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
    
    // 获取客户端信息
    const client = await getOAuthClient(body.clientId, c.env);
    if (!client) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_client',
          message: 'Invalid client ID'
        },
        timestamp: Date.now()
      }, 401);
    }
    
    // 验证重定向 URI
    if (!validateRedirectUri(body.redirectUri, client)) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Invalid redirect URI'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 验证 scope
    if (!validateScope(body.scope, client)) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_scope',
          message: 'Invalid scope requested'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 处理不同的响应类型
    if (body.responseType === 'code') {
      // 授权码模式
      const scope = body.scope ? body.scope.split(' ') : [];
      const code = await generateAuthorizationCode(
        body.clientId,
        body.userId,
        body.redirectUri,
        scope,
        c.env
      );
      
      // 构建重定向 URL
      const redirectUrl = new URL(body.redirectUri);
      redirectUrl.searchParams.set('code', code);
      if (body.state) {
        redirectUrl.searchParams.set('state', body.state);
      }
      
      return c.json<ApiResponse>({
        success: true,
        data: {
          code,
          redirectUri: redirectUrl.toString(),
          state: body.state
        },
        timestamp: Date.now()
      });
      
    } else if (body.responseType === 'token') {
      // 隐式授权模式（不推荐使用）
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'unsupported_response_type',
          message: 'Implicit grant is not supported for security reasons'
        },
        timestamp: Date.now()
      }, 400);
    } else {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'unsupported_response_type',
          message: `Unsupported response type: ${body.responseType}`
        },
        timestamp: Date.now()
      }, 400);
    }
    
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
 * OAuth 令牌端点
 * POST /oauth/token
 */
export async function token(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<OAuthTokenRequest>();
    
    // 验证必填字段
    const validation = validateRequired(body, [
      'grantType',
      'clientId',
      'clientSecret'
    ]);
    
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
    
    let result: { success: boolean; token?: TokenResponse; error?: string };
    
    // 根据 grant type 处理
    switch (body.grantType) {
      case 'authorization_code':
        // 授权码模式
        if (!body.code || !body.redirectUri) {
          return c.json<ApiResponse>({
            success: false,
            error: {
              code: 'invalid_request',
              message: 'Authorization code and redirect URI required'
            },
            timestamp: Date.now()
          }, 400);
        }
        
        result = await exchangeAuthorizationCode(
          body.code,
          body.clientId,
          body.clientSecret,
          body.redirectUri,
          c.env
        );
        break;
        
      case 'client_credentials':
        // 客户端凭证模式
        result = await clientCredentialsGrant(
          body.clientId,
          body.clientSecret,
          body.scope,
          c.env
        );
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
        
        // 这里可以添加刷新令牌逻辑
        return c.json<ApiResponse>({
          success: false,
          error: {
            code: 'unsupported_grant_type',
            message: 'Refresh token grant not yet implemented for OAuth'
          },
          timestamp: Date.now()
        }, 400);
        
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
    
    if (!result.success) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_grant',
          message: result.error || 'Token generation failed'
        },
        timestamp: Date.now()
      }, 401);
    }
    
    return c.json<ApiResponse<TokenResponse>>({
      success: true,
      data: result.token,
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
