// JWT 生成和验证服务

import type { JWTPayload, Env } from '../types';
import { base64UrlEncode, base64UrlDecode, hmacSign } from '../utils/crypto';
import { parseExpireTime } from '../utils/validation';

/**
 * 生成 JWT 令牌
 */
export async function generateJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string,
  expiresIn: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseExpireTime(expiresIn);
  
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp
  };
  
  // 创建 header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  // Base64URL 编码 header 和 payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  
  // 生成签名
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await hmacSign(signatureInput, secret);
  const encodedSignature = base64UrlEncode(signature);
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * 验证 JWT 令牌
 */
export async function verifyJWT(
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }
    
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    // 验证签名
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = await hmacSign(signatureInput, secret);
    const expectedEncodedSignature = base64UrlEncode(expectedSignature);
    
    if (encodedSignature !== expectedEncodedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // 解码 payload
    const payloadStr = base64UrlDecode(encodedPayload);
    const payload: JWTPayload = JSON.parse(payloadStr);
    
    // 验证过期时间
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired', payload };
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * 生成访问令牌
 */
export async function generateAccessToken(
  userId: string,
  email: string | undefined,
  roles: string[] | undefined,
  sessionId: string | undefined,
  env: Env
): Promise<string> {
  return generateJWT(
    {
      sub: userId,
      email,
      roles,
      type: 'access',
      sessionId
    },
    env.JWT_SECRET,
    env.JWT_ACCESS_EXPIRES_IN || '15m'
  );
}

/**
 * 生成刷新令牌
 */
export async function generateRefreshToken(
  userId: string,
  sessionId: string | undefined,
  env: Env
): Promise<string> {
  const jti = crypto.randomUUID();
  
  const token = await generateJWT(
    {
      sub: userId,
      type: 'refresh',
      jti,
      sessionId
    },
    env.JWT_SECRET,
    env.JWT_REFRESH_EXPIRES_IN || '7d'
  );
  
  // 将刷新令牌存储到 KV，用于撤销检查
  const expiresIn = parseExpireTime(env.JWT_REFRESH_EXPIRES_IN || '7d');
  await env.TOKEN_KV.put(
    `refresh:${jti}`,
    JSON.stringify({ userId, sessionId, createdAt: Date.now() }),
    { expirationTtl: expiresIn }
  );
  
  return token;
}

/**
 * 验证访问令牌
 */
export async function verifyAccessToken(
  token: string,
  env: Env
): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
  const result = await verifyJWT(token, env.JWT_SECRET);
  
  if (!result.valid) {
    return result;
  }
  
  if (result.payload?.type !== 'access') {
    return { valid: false, error: 'Invalid token type' };
  }
  
  return result;
}

/**
 * 验证刷新令牌
 */
export async function verifyRefreshToken(
  token: string,
  env: Env
): Promise<{ valid: boolean; payload?: JWTPayload; error?: string }> {
  const result = await verifyJWT(token, env.JWT_SECRET);
  
  if (!result.valid) {
    return result;
  }
  
  if (result.payload?.type !== 'refresh') {
    return { valid: false, error: 'Invalid token type' };
  }
  
  // 检查令牌是否已被撤销
  if (result.payload.jti) {
    const tokenData = await env.TOKEN_KV.get(`refresh:${result.payload.jti}`);
    if (!tokenData) {
      return { valid: false, error: 'Token has been revoked' };
    }
  }
  
  return result;
}

/**
 * 撤销刷新令牌
 */
export async function revokeRefreshToken(token: string, env: Env): Promise<boolean> {
  const result = await verifyJWT(token, env.JWT_SECRET);
  
  if (result.payload?.jti) {
    await env.TOKEN_KV.delete(`refresh:${result.payload.jti}`);
    return true;
  }
  
  return false;
}

/**
 * 解码 JWT（不验证签名）
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payloadStr = base64UrlDecode(parts[1]);
    return JSON.parse(payloadStr);
  } catch {
    return null;
  }
}
