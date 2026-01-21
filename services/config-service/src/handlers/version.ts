// 版本管理处理器

import type { Context } from 'hono';
import type { Bindings, AuditLog } from '../types';
import { StorageService } from '../services/storage';
import { VersionService } from '../services/version';
import { EncryptionService } from '../services/encryption';
import { generateId } from '../utils/crypto';
import { getOperator, getClientIP } from '../middleware/auth';
import {
  isValidEnvironment,
  isValidServiceName,
  isValidConfigKey,
  isValidVersion,
} from '../utils/validation';

type AppContext = Context<{ Bindings: Bindings; Variables: { user?: { id: string; name: string; role: string } } }>;

/**
 * 获取配置的版本历史
 */
export async function getVersionHistory(c: AppContext) {
  const env = c.req.param('env');
  const service = c.req.param('service');
  const key = c.req.param('key');

  // 验证参数
  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }
  if (!isValidServiceName(service)) {
    return c.json({ error: '无效的服务名称' }, 400);
  }
  if (!isValidConfigKey(key)) {
    return c.json({ error: '无效的配置键' }, 400);
  }

  // 获取查询参数
  const limit = parseInt(c.req.query('limit') || '10', 10);

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);
  const versionService = new VersionService(storage, encryption);

  try {
    const versions = await versionService.getVersionHistory(env, service, key, limit);

    return c.json({
      environment: env,
      service,
      key,
      versions,
      count: versions.length,
    });
  } catch (error) {
    return c.json({ error: `获取版本历史失败: ${error}` }, 500);
  }
}

/**
 * 获取特定版本的详情
 */
export async function getVersionDetail(c: Context<{ Bindings: Bindings }>) {
  const env = c.req.param('env');
  const service = c.req.param('service');
  const key = c.req.param('key');
  const versionNum = parseInt(c.req.param('version'), 10);

  // 验证参数
  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }
  if (!isValidServiceName(service)) {
    return c.json({ error: '无效的服务名称' }, 400);
  }
  if (!isValidConfigKey(key)) {
    return c.json({ error: '无效的配置键' }, 400);
  }
  if (!isValidVersion(versionNum)) {
    return c.json({ error: '无效的版本号' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);
  const versionService = new VersionService(storage, encryption);

  try {
    const version = await versionService.getVersionDetail(env, service, key, versionNum);

    if (!version) {
      return c.json({ error: '版本不存在' }, 404);
    }

    return c.json({
      environment: env,
      service,
      key,
      version,
    });
  } catch (error) {
    return c.json({ error: `获取版本详情失败: ${error}` }, 500);
  }
}

/**
 * 回滚配置到指定版本
 */
export async function rollbackToVersion(c: Context<{ Bindings: Bindings }>) {
  const env = c.req.param('env');
  const service = c.req.param('service');
  const key = c.req.param('key');
  const versionNum = parseInt(c.req.param('version'), 10);

  // 验证参数
  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }
  if (!isValidServiceName(service)) {
    return c.json({ error: '无效的服务名称' }, 400);
  }
  if (!isValidConfigKey(key)) {
    return c.json({ error: '无效的配置键' }, 400);
  }
  if (!isValidVersion(versionNum)) {
    return c.json({ error: '无效的版本号' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);
  const versionService = new VersionService(storage, encryption);

  try {
    const config = await versionService.rollbackToVersion(
      env,
      service,
      key,
      versionNum,
      getOperator(c)
    );

    // 记录审计日志
    const auditLog: AuditLog = {
      id: generateId(),
      environment: env,
      service,
      key,
      action: 'rollback',
      newValue: `回滚到版本 ${versionNum}`,
      operator: getOperator(c),
      timestamp: new Date().toISOString(),
      ip: getClientIP(c),
    };
    await storage.saveAuditLog(env, service, auditLog);

    return c.json({
      message: `配置已回滚到版本 ${versionNum}`,
      config: {
        ...config,
        value: config.encrypted ? '[ENCRYPTED]' : config.value,
      },
    });
  } catch (error) {
    return c.json({ error: `回滚失败: ${error}` }, 500);
  }
}

/**
 * 比较两个版本
 */
export async function compareVersions(c: Context<{ Bindings: Bindings }>) {
  const env = c.req.param('env');
  const service = c.req.param('service');
  const key = c.req.param('key');
  const version1 = parseInt(c.req.query('v1') || '0', 10);
  const version2 = parseInt(c.req.query('v2') || '0', 10);

  // 验证参数
  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }
  if (!isValidServiceName(service)) {
    return c.json({ error: '无效的服务名称' }, 400);
  }
  if (!isValidConfigKey(key)) {
    return c.json({ error: '无效的配置键' }, 400);
  }
  if (!isValidVersion(version1) || !isValidVersion(version2)) {
    return c.json({ error: '无效的版本号' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);
  const versionService = new VersionService(storage, encryption);

  try {
    const comparison = await versionService.compareVersions(env, service, key, version1, version2);

    return c.json({
      environment: env,
      service,
      key,
      comparison,
    });
  } catch (error) {
    return c.json({ error: `版本比较失败: ${error}` }, 500);
  }
}

/**
 * 获取审计日志
 */
export async function getAuditLogs(c: Context<{ Bindings: Bindings }>) {
  const env = c.req.param('env');
  const service = c.req.param('service');

  // 验证参数
  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }
  if (!isValidServiceName(service)) {
    return c.json({ error: '无效的服务名称' }, 400);
  }

  // 获取查询参数
  const limit = parseInt(c.req.query('limit') || '100', 10);

  const storage = new StorageService(c.env.CONFIG_KV);

  try {
    const logs = await storage.getAuditLogs(env, service, Math.min(limit, 1000));

    return c.json({
      environment: env,
      service,
      logs,
      count: logs.length,
    });
  } catch (error) {
    return c.json({ error: `获取审计日志失败: ${error}` }, 500);
  }
}
