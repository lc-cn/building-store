/**
 * 缓存工具
 */

import { Env } from '../types';

/**
 * 缓存包装器
 */
export class CacheManager {
  constructor(private env: Env) {}

  /**
   * 获取缓存值
   */
  async get<T>(namespace: KVNamespace, key: string): Promise<T | null> {
    try {
      const value = await namespace.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`获取缓存失败 [${key}]:`, error);
      return null;
    }
  }

  /**
   * 设置缓存值
   */
  async set<T>(
    namespace: KVNamespace,
    key: string,
    value: T,
    expirationTtl?: number
  ): Promise<void> {
    try {
      await namespace.put(key, JSON.stringify(value), {
        expirationTtl,
      });
    } catch (error) {
      console.error(`设置缓存失败 [${key}]:`, error);
    }
  }

  /**
   * 删除缓存值
   */
  async delete(namespace: KVNamespace, key: string): Promise<void> {
    try {
      await namespace.delete(key);
    } catch (error) {
      console.error(`删除缓存失败 [${key}]:`, error);
    }
  }

  /**
   * 列出所有键
   */
  async list(
    namespace: KVNamespace,
    prefix?: string
  ): Promise<string[]> {
    try {
      const result = await namespace.list({ prefix });
      return result.keys.map(k => k.name);
    } catch (error) {
      console.error('列出缓存键失败:', error);
      return [];
    }
  }

  /**
   * 清除所有匹配前缀的键
   */
  async clearPrefix(namespace: KVNamespace, prefix: string): Promise<number> {
    try {
      const keys = await this.list(namespace, prefix);
      await Promise.all(keys.map(key => namespace.delete(key)));
      return keys.length;
    } catch (error) {
      console.error(`清除缓存前缀失败 [${prefix}]:`, error);
      return 0;
    }
  }
}

/**
 * 内存缓存（用于单次请求内的缓存）
 */
export class MemoryCache<T> {
  private cache: Map<string, { value: T; expiresAt: number }> = new Map();

  /**
   * 获取缓存值
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttlMs: number = 60000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * 删除缓存值
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 清除过期缓存
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}
