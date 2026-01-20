// 加密服务

import { encrypt, decrypt } from '../utils/crypto';

/**
 * 加密服务类
 */
export class EncryptionService {
  constructor(private encryptionKey: string) {}

  /**
   * 加密配置值
   */
  async encrypt(value: string): Promise<string> {
    try {
      return await encrypt(value, this.encryptionKey);
    } catch (error) {
      throw new Error(`加密失败: ${error}`);
    }
  }

  /**
   * 解密配置值
   */
  async decrypt(encryptedValue: string): Promise<string> {
    try {
      return await decrypt(encryptedValue, this.encryptionKey);
    } catch (error) {
      throw new Error(`解密失败: ${error}`);
    }
  }

  /**
   * 判断值是否需要加密
   * 通常敏感字段需要加密：password, secret, token, key 等
   */
  shouldEncrypt(key: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /token/i,
      /key$/i,
      /apikey/i,
      /private/i,
      /credential/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(key));
  }

  /**
   * 批量加密
   */
  async encryptBatch(values: Record<string, string>): Promise<Record<string, string>> {
    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(values)) {
      encrypted[key] = await this.encrypt(value);
    }

    return encrypted;
  }

  /**
   * 批量解密
   */
  async decryptBatch(encryptedValues: Record<string, string>): Promise<Record<string, string>> {
    const decrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(encryptedValues)) {
      try {
        decrypted[key] = await this.decrypt(value);
      } catch {
        // 如果解密失败，保持原值
        decrypted[key] = value;
      }
    }

    return decrypted;
  }
}
