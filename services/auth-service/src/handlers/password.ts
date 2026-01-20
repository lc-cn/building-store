// 密码重置处理器

import type { Context } from 'hono';
import type {
  Env,
  PasswordResetRequest,
  PasswordResetVerifyRequest,
  PasswordResetConfirmRequest,
  PasswordResetToken,
  ApiResponse
} from '../types';
import { generateSecureToken } from '../utils/crypto';
import { hashPassword } from '../utils/crypto';
import { isValidEmail, validateRequired } from '../utils/validation';

/**
 * 请求密码重置
 * POST /password/reset
 */
export async function requestPasswordReset(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<PasswordResetRequest>();
    
    // 验证必填字段
    const validation = validateRequired(body, ['email']);
    if (!validation.valid) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Email required',
          details: validation.missing
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 验证邮箱格式
    if (!isValidEmail(body.email)) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Invalid email format'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 查找用户（实际应用中应该调用用户服务）
    const userKey = `user:${body.email}`;
    const userData = await c.env.AUTH_KV.get(userKey);
    
    // 即使用户不存在，也返回成功，避免用户枚举攻击
    if (!userData) {
      return c.json<ApiResponse>({
        success: true,
        data: {
          message: 'If the email exists, a password reset link has been sent'
        },
        timestamp: Date.now()
      });
    }
    
    const user = JSON.parse(userData);
    
    // 生成重置令牌
    const token = generateSecureToken(32);
    const expiresAt = Date.now() + 3600000; // 1小时有效期
    
    const resetToken: PasswordResetToken = {
      token,
      userId: user.userId,
      email: body.email,
      expiresAt,
      createdAt: Date.now(),
      used: false
    };
    
    // 存储重置令牌到 KV
    await c.env.AUTH_KV.put(
      `password:reset:${token}`,
      JSON.stringify(resetToken),
      { expirationTtl: 3600 } // 1小时
    );
    
    // 实际应用中应该发送邮件
    // 这里只返回令牌（仅用于开发/测试）
    console.log(`Password reset token for ${body.email}: ${token}`);
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        message: 'If the email exists, a password reset link has been sent',
        // 仅在开发环境返回令牌
        ...(c.env.JWT_SECRET.includes('dev') && { token })
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
}

/**
 * 验证重置令牌
 * POST /password/reset/verify
 */
export async function verifyPasswordResetToken(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<PasswordResetVerifyRequest>();
    
    // 验证必填字段
    const validation = validateRequired(body, ['token']);
    if (!validation.valid) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Token required',
          details: validation.missing
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 获取重置令牌
    const tokenData = await c.env.AUTH_KV.get(`password:reset:${body.token}`);
    
    if (!tokenData) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_token',
          message: 'Invalid or expired reset token'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    const resetToken: PasswordResetToken = JSON.parse(tokenData);
    
    // 验证是否已使用
    if (resetToken.used) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_token',
          message: 'Reset token has already been used'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 验证是否过期
    if (resetToken.expiresAt < Date.now()) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'expired_token',
          message: 'Reset token has expired'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        valid: true,
        email: resetToken.email
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
}

/**
 * 确认密码重置
 * POST /password/reset/confirm
 */
export async function confirmPasswordReset(c: Context<{ Bindings: Env }>): Promise<Response> {
  try {
    const body = await c.req.json<PasswordResetConfirmRequest>();
    
    // 验证必填字段
    const validation = validateRequired(body, ['token', 'newPassword']);
    if (!validation.valid) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_request',
          message: 'Token and new password required',
          details: validation.missing
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 获取重置令牌
    const tokenData = await c.env.AUTH_KV.get(`password:reset:${body.token}`);
    
    if (!tokenData) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_token',
          message: 'Invalid or expired reset token'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    const resetToken: PasswordResetToken = JSON.parse(tokenData);
    
    // 验证是否已使用
    if (resetToken.used) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'invalid_token',
          message: 'Reset token has already been used'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 验证是否过期
    if (resetToken.expiresAt < Date.now()) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'expired_token',
          message: 'Reset token has expired'
        },
        timestamp: Date.now()
      }, 400);
    }
    
    // 哈希新密码
    const newPasswordHash = await hashPassword(body.newPassword);
    
    // 更新用户密码（实际应用中应该调用用户服务）
    const userKey = `user:${resetToken.email}`;
    const userData = await c.env.AUTH_KV.get(userKey);
    
    if (!userData) {
      return c.json<ApiResponse>({
        success: false,
        error: {
          code: 'user_not_found',
          message: 'User not found'
        },
        timestamp: Date.now()
      }, 404);
    }
    
    const user = JSON.parse(userData);
    user.passwordHash = newPasswordHash;
    
    await c.env.AUTH_KV.put(userKey, JSON.stringify(user));
    
    // 标记令牌为已使用
    resetToken.used = true;
    await c.env.AUTH_KV.put(
      `password:reset:${body.token}`,
      JSON.stringify(resetToken),
      { expirationTtl: 3600 }
    );
    
    return c.json<ApiResponse>({
      success: true,
      data: {
        message: 'Password has been reset successfully'
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
}
