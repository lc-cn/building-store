// 验证工具函数

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 * 要求：至少8个字符，包含大小写字母、数字
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumber;
}

/**
 * 验证 URL 格式
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 验证重定向 URI
 */
export function isValidRedirectUri(uri: string, allowedUris: string[]): boolean {
  return allowedUris.includes(uri);
}

/**
 * 验证 scope
 */
export function isValidScope(scope: string | undefined, allowedScopes: string[]): boolean {
  if (!scope) {
    return true;
  }
  
  const requestedScopes = scope.split(' ');
  return requestedScopes.every(s => allowedScopes.includes(s));
}

/**
 * 验证客户端ID格式
 */
export function isValidClientId(clientId: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(clientId) && clientId.length >= 8;
}

/**
 * 验证 grant type
 */
export function isValidGrantType(grantType: string): boolean {
  const validGrantTypes = [
    'password',
    'refresh_token',
    'client_credentials',
    'authorization_code'
  ];
  return validGrantTypes.includes(grantType);
}

/**
 * 验证响应类型
 */
export function isValidResponseType(responseType: string): boolean {
  return ['code', 'token'].includes(responseType);
}

/**
 * 验证令牌格式（JWT）
 */
export function isValidJWTFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * 清理和验证用户输入
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

/**
 * 验证必填字段
 */
export function validateRequired(fields: Record<string, any>, requiredFields: string[]): {
  valid: boolean;
  missing: string[];
} {
  const missing = requiredFields.filter(field => !fields[field]);
  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * 验证令牌过期时间格式
 * 支持格式: "15m", "1h", "7d", "30d"
 */
export function parseExpireTime(expireStr: string): number {
  const match = expireStr.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expire time format: ${expireStr}`);
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400
  };
  
  return value * multipliers[unit];
}

/**
 * 验证会话ID格式
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^[a-f0-9-]{36}$/.test(sessionId); // UUID format
}
