// 存储服务 - KV 操作封装

import type { ConfigItem, ConfigVersion, AuditLog, Bindings } from '../types';
import {
  buildConfigKey,
  buildVersionKey,
  buildAuditKey,
  buildEnvironmentKey,
  KV_PREFIX,
  type Environment,
} from '../types';

/**
 * 存储服务类
 */
export class StorageService {
  constructor(private kv: KVNamespace) {}

  // ==================== 配置操作 ====================

  /**
   * 获取配置
   */
  async getConfig(env: Environment, service: string, key: string): Promise<ConfigItem | null> {
    const kvKey = buildConfigKey(env, service, key);
    const value = await this.kv.get(kvKey, 'json');
    return value as ConfigItem | null;
  }

  /**
   * 保存配置
   */
  async saveConfig(env: Environment, service: string, key: string, config: ConfigItem): Promise<void> {
    const kvKey = buildConfigKey(env, service, key);
    await this.kv.put(kvKey, JSON.stringify(config));
  }

  /**
   * 删除配置
   */
  async deleteConfig(env: Environment, service: string, key: string): Promise<void> {
    const kvKey = buildConfigKey(env, service, key);
    await this.kv.delete(kvKey);
  }

  /**
   * 获取服务的所有配置
   */
  async getServiceConfigs(env: Environment, service: string): Promise<Record<string, ConfigItem>> {
    const prefix = `${KV_PREFIX.CONFIG}:${env}:${service}:`;
    const list = await this.kv.list({ prefix });
    
    const configs: Record<string, ConfigItem> = {};
    
    for (const item of list.keys) {
      const key = item.name.substring(prefix.length);
      const value = await this.kv.get(item.name, 'json');
      if (value) {
        configs[key] = value as ConfigItem;
      }
    }
    
    return configs;
  }

  /**
   * 检查配置是否存在
   */
  async configExists(env: Environment, service: string, key: string): Promise<boolean> {
    const kvKey = buildConfigKey(env, service, key);
    const value = await this.kv.get(kvKey);
    return value !== null;
  }

  // ==================== 版本操作 ====================

  /**
   * 保存配置版本
   */
  async saveVersion(
    env: Environment,
    service: string,
    key: string,
    version: ConfigVersion
  ): Promise<void> {
    const kvKey = buildVersionKey(env, service, key, version.version);
    await this.kv.put(kvKey, JSON.stringify(version));
    
    // 同时更新版本列表
    await this.addToVersionList(env, service, key, version.version);
  }

  /**
   * 获取配置版本
   */
  async getVersion(
    env: Environment,
    service: string,
    key: string,
    version: number
  ): Promise<ConfigVersion | null> {
    const kvKey = buildVersionKey(env, service, key, version);
    const value = await this.kv.get(kvKey, 'json');
    return value as ConfigVersion | null;
  }

  /**
   * 获取所有版本号列表
   */
  async getVersionList(env: Environment, service: string, key: string): Promise<number[]> {
    const listKey = `${buildVersionKey(env, service, key)}:list`;
    const value = await this.kv.get(listKey, 'json');
    return (value as number[]) || [];
  }

  /**
   * 添加版本到列表
   */
  private async addToVersionList(
    env: Environment,
    service: string,
    key: string,
    version: number
  ): Promise<void> {
    const listKey = `${buildVersionKey(env, service, key)}:list`;
    const versions = await this.getVersionList(env, service, key);
    
    if (!versions.includes(version)) {
      versions.push(version);
      versions.sort((a, b) => b - a); // 降序排列
      await this.kv.put(listKey, JSON.stringify(versions));
    }
  }

  /**
   * 获取最新版本号
   */
  async getLatestVersionNumber(env: Environment, service: string, key: string): Promise<number> {
    const versions = await this.getVersionList(env, service, key);
    return versions.length > 0 ? versions[0] : 0;
  }

  // ==================== 审计日志操作 ====================

  /**
   * 保存审计日志
   */
  async saveAuditLog(env: Environment, service: string, log: AuditLog): Promise<void> {
    const kvKey = buildAuditKey(env, service, log.id);
    await this.kv.put(kvKey, JSON.stringify(log));
    
    // 同时添加到日志索引
    await this.addToAuditIndex(env, service, log.id);
  }

  /**
   * 获取审计日志
   */
  async getAuditLog(env: Environment, service: string, id: string): Promise<AuditLog | null> {
    const kvKey = buildAuditKey(env, service, id);
    const value = await this.kv.get(kvKey, 'json');
    return value as AuditLog | null;
  }

  /**
   * 获取审计日志列表
   */
  async getAuditLogs(
    env: Environment,
    service: string,
    limit: number = 100
  ): Promise<AuditLog[]> {
    const indexKey = `${KV_PREFIX.AUDIT}:${env}:${service}:index`;
    const ids = await this.kv.get(indexKey, 'json') as string[] || [];
    
    const logs: AuditLog[] = [];
    const limitedIds = ids.slice(0, limit);
    
    for (const id of limitedIds) {
      const log = await this.getAuditLog(env, service, id);
      if (log) {
        logs.push(log);
      }
    }
    
    return logs;
  }

  /**
   * 添加到审计日志索引
   */
  private async addToAuditIndex(env: Environment, service: string, id: string): Promise<void> {
    const indexKey = `${KV_PREFIX.AUDIT}:${env}:${service}:index`;
    const ids = await this.kv.get(indexKey, 'json') as string[] || [];
    
    ids.unshift(id); // 添加到开头
    
    // 只保留最近1000条
    if (ids.length > 1000) {
      ids.splice(1000);
    }
    
    await this.kv.put(indexKey, JSON.stringify(ids));
  }

  // ==================== 环境操作 ====================

  /**
   * 获取环境配置
   */
  async getEnvironment(env: Environment) {
    const kvKey = buildEnvironmentKey(env);
    const value = await this.kv.get(kvKey, 'json');
    return value;
  }

  /**
   * 保存环境配置
   */
  async saveEnvironment(env: Environment, config: any): Promise<void> {
    const kvKey = buildEnvironmentKey(env);
    await this.kv.put(kvKey, JSON.stringify(config));
  }

  /**
   * 列出所有环境
   */
  async listEnvironments() {
    const prefix = `${KV_PREFIX.ENVIRONMENT}:`;
    const list = await this.kv.list({ prefix });
    
    const environments = [];
    for (const item of list.keys) {
      const value = await this.kv.get(item.name, 'json');
      if (value) {
        environments.push(value);
      }
    }
    
    return environments;
  }

  // ==================== 服务列表操作 ====================

  /**
   * 获取环境下的所有服务
   */
  async getServices(env: Environment): Promise<string[]> {
    const prefix = `${KV_PREFIX.CONFIG}:${env}:`;
    const list = await this.kv.list({ prefix });
    
    const services = new Set<string>();
    
    for (const item of list.keys) {
      const parts = item.name.split(':');
      if (parts.length >= 3) {
        services.add(parts[2]);
      }
    }
    
    return Array.from(services).sort();
  }
}
