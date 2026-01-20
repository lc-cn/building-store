// 加密工具函数

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  return Array.from(randomValues)
    .map(v => chars[v % chars.length])
    .join('');
}

/**
 * 生成UUID v4
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * 哈希密码（使用 SHA-256）
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const actualSalt = salt || generateRandomString(16);
  const encoder = new TextEncoder();
  const data = encoder.encode(password + actualSalt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${actualSalt}:${hashHex}`;
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt] = hashedPassword.split(':');
  const newHash = await hashPassword(password, salt);
  return newHash === hashedPassword;
}

/**
 * Base64 URL 编码
 */
export function base64UrlEncode(str: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // 使用 reduce 避免 spread 操作符在大数据时的堆栈溢出
  let binaryString = '';
  for (let i = 0; i < data.length; i++) {
    binaryString += String.fromCharCode(data[i]);
  }
  
  const base64 = btoa(binaryString);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Base64 URL 解码
 */
export function base64UrlDecode(str: string): string {
  let base64 = str
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  // 添加填充
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  
  const decoded = atob(base64);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  
  const decoder = new TextDecoder();
  return decoder.decode(bytes);
}

/**
 * HMAC-SHA256 签名
 */
export async function hmacSign(data: string, secret: string): Promise<string> {
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
  const signatureArray = Array.from(new Uint8Array(signature));
  return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 验证 HMAC-SHA256 签名
 */
export async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const computedSignature = await hmacSign(data, secret);
  // 使用时间安全的比较函数防止时序攻击
  return timingSafeEqual(computedSignature, signature);
}

/**
 * 生成安全的令牌
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 时间安全的字符串比较
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}
