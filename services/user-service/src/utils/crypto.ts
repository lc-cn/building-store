// 加密工具函数

/**
 * 生成随机盐值
 */
async function generateSalt(): Promise<string> {
  const saltBuffer = new Uint8Array(16);
  crypto.getRandomValues(saltBuffer);
  return Array.from(saltBuffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 哈希密码（使用盐值）
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hash}`;
}

/**
 * 验证密码
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return computedHash === hash;
}

/**
 * 生成 JWT Token
 */
export async function generateToken(payload: any, secret: string, expiresIn: number = 86400): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
  const message = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  
  return `${message}.${encodedSignature}`;
}

/**
 * Base64 URL 编码
 */
function base64UrlEncode(input: string | Uint8Array): string {
  let str: string;
  if (typeof input === 'string') {
    const utf8Bytes = new TextEncoder().encode(input);
    str = btoa(String.fromCharCode(...utf8Bytes));
  } else {
    str = btoa(String.fromCharCode(...input));
  }
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Base64 URL 解码
 */
function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  const binaryStr = atob(str);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * 验证 JWT Token
 */
export async function verifyToken(token: string, secret: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const message = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  let signatureStr = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
  while (signatureStr.length % 4) {
    signatureStr += '=';
  }
  const signature = Uint8Array.from(atob(signatureStr), c => c.charCodeAt(0));
  
  const isValid = await crypto.subtle.verify('HMAC', key, signature, messageData);
  
  if (!isValid) {
    throw new Error('Invalid token signature');
  }
  
  const payload = JSON.parse(base64UrlDecode(encodedPayload));
  
  // 检查过期时间
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired');
  }
  
  return payload;
}
