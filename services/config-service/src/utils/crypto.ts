// 加密工具函数

/**
 * AES-GCM 加密
 */
export async function encrypt(text: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // 生成密钥
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // 生成随机 IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // 加密
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );
  
  // 组合 IV 和加密数据
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  // 转换为 Base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * AES-GCM 解密
 */
export async function decrypt(encryptedText: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // 从 Base64 解码
  const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
  
  // 提取 IV 和加密数据
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // 生成密钥
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // 解密
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encrypted
  );
  
  // 转换为字符串
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 哈希字符串（用于审计日志）
 */
export async function hashString(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
