// 版本控制服务

import type { ConfigItem, ConfigVersion, Environment } from '../types';
import { StorageService } from './storage';
import { EncryptionService } from './encryption';

/**
 * 版本控制服务类
 */
export class VersionService {
  constructor(
    private storage: StorageService,
    private encryption: EncryptionService
  ) {}

  /**
   * 创建新版本
   */
  async createVersion(
    env: Environment,
    service: string,
    key: string,
    config: ConfigItem,
    operator: string
  ): Promise<number> {
    // 获取下一个版本号
    const latestVersion = await this.storage.getLatestVersionNumber(env, service, key);
    const newVersion = latestVersion + 1;

    // 创建版本记录
    const version: ConfigVersion = {
      version: newVersion,
      value: config.value,
      encrypted: config.encrypted,
      description: config.description,
      createdAt: new Date().toISOString(),
      createdBy: operator,
    };

    // 保存版本
    await this.storage.saveVersion(env, service, key, version);

    return newVersion;
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(
    env: Environment,
    service: string,
    key: string,
    limit: number = 10
  ): Promise<ConfigVersion[]> {
    const versionNumbers = await this.storage.getVersionList(env, service, key);
    const limitedVersions = versionNumbers.slice(0, limit);

    const versions: ConfigVersion[] = [];

    for (const versionNum of limitedVersions) {
      const version = await this.storage.getVersion(env, service, key, versionNum);
      if (version) {
        // 如果是加密的，只返回加密标记，不返回实际值
        if (version.encrypted) {
          versions.push({
            ...version,
            value: '[ENCRYPTED]',
          });
        } else {
          versions.push(version);
        }
      }
    }

    return versions;
  }

  /**
   * 回滚到指定版本
   */
  async rollbackToVersion(
    env: Environment,
    service: string,
    key: string,
    targetVersion: number,
    operator: string
  ): Promise<ConfigItem> {
    // 获取目标版本
    const version = await this.storage.getVersion(env, service, key, targetVersion);
    if (!version) {
      throw new Error(`版本 ${targetVersion} 不存在`);
    }

    // 获取当前配置（用于创建新版本）
    const currentConfig = await this.storage.getConfig(env, service, key);
    if (currentConfig) {
      // 保存当前版本（作为回滚前的快照）
      await this.createVersion(env, service, key, currentConfig, operator);
    }

    // 创建新的配置项（使用目标版本的值）
    const newConfig: ConfigItem = {
      key,
      value: version.value,
      encrypted: version.encrypted,
      description: `回滚到版本 ${targetVersion}`,
      createdAt: currentConfig?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: currentConfig?.createdBy || operator,
    };

    // 保存配置
    await this.storage.saveConfig(env, service, key, newConfig);

    return newConfig;
  }

  /**
   * 获取特定版本的详细信息（包括解密）
   */
  async getVersionDetail(
    env: Environment,
    service: string,
    key: string,
    versionNum: number
  ): Promise<ConfigVersion | null> {
    const version = await this.storage.getVersion(env, service, key, versionNum);
    if (!version) {
      return null;
    }

    // 如果是加密的，解密后返回
    if (version.encrypted) {
      try {
        const decryptedValue = await this.encryption.decrypt(version.value);
        return {
          ...version,
          value: decryptedValue,
        };
      } catch (error) {
        throw new Error('解密失败');
      }
    }

    return version;
  }

  /**
   * 比较两个版本的差异
   */
  async compareVersions(
    env: Environment,
    service: string,
    key: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: ConfigVersion | null;
    version2: ConfigVersion | null;
    diff: string;
  }> {
    const v1 = await this.getVersionDetail(env, service, key, version1);
    const v2 = await this.getVersionDetail(env, service, key, version2);

    let diff = '';
    if (v1 && v2) {
      if (v1.value !== v2.value) {
        diff = `值从 "${v1.value}" 变更为 "${v2.value}"`;
      } else {
        diff = '无变化';
      }
    }

    return { version1: v1, version2: v2, diff };
  }
}
