// 配置管理处理器

import type { Context } from 'hono';
import type { Bindings, ConfigItem, AuditLog, Environment } from '../types';
import { StorageService } from '../services/storage';
import { VersionService } from '../services/version';
import { EncryptionService } from '../services/encryption';
import { generateId } from '../utils/crypto';
import { getOperator, getClientIP } from '../middleware/auth';
import {
  isValidEnvironment,
  isValidServiceName,
  isValidConfigKey,
  isValidConfigValue,
  sanitizeInput,
} from '../utils/validation';

type AppContext = Context<{ Bindings: Bindings; Variables: { user?: { id: string; name: string; role: string } } }>;

/**
 * 获取单个配置
 */
export async function getConfig(c: AppContext) {
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

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);

  try {
    const config = await storage.getConfig(env, service, key);
    
    if (!config) {
      return c.json({ error: '配置不存在' }, 404);
    }

    // 记录审计日志
    const auditLog: AuditLog = {
      id: generateId(),
      environment: env,
      service,
      key,
      action: 'read',
      operator: getOperator(c),
      timestamp: new Date().toISOString(),
      ip: getClientIP(c),
    };
    await storage.saveAuditLog(env, service, auditLog);

    // 如果配置是加密的，解密后返回
    if (config.encrypted) {
      try {
        const decryptedValue = await encryption.decrypt(config.value);
        return c.json({
          ...config,
          value: decryptedValue,
        });
      } catch (error) {
        return c.json({ error: '解密失败' }, 500);
      }
    }

    return c.json(config);
  } catch (error) {
    return c.json({ error: `获取配置失败: ${error}` }, 500);
  }
}

/**
 * 获取服务的所有配置
 */
export async function getServiceConfigs(c: AppContext) {
  const env = c.req.param('env');
  const service = c.req.param('service');

  // 验证参数
  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }
  if (!isValidServiceName(service)) {
    return c.json({ error: '无效的服务名称' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);

  try {
    const configs = await storage.getServiceConfigs(env, service);

    // 解密所有加密的配置
    for (const [key, config] of Object.entries(configs)) {
      if (config.encrypted) {
        try {
          const decryptedValue = await encryption.decrypt(config.value);
          configs[key] = {
            ...config,
            value: decryptedValue,
          };
        } catch (error) {
          // 解密失败时保持原值
          console.error(`解密配置 ${key} 失败:`, error);
        }
      }
    }

    return c.json({
      environment: env,
      service,
      configs,
      count: Object.keys(configs).length,
    });
  } catch (error) {
    return c.json({ error: `获取配置失败: ${error}` }, 500);
  }
}

/**
 * 创建配置
 */
export async function createConfig(c: AppContext) {
  const env = c.req.param('env');
  const service = c.req.param('service');

  // 验证参数
  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }
  if (!isValidServiceName(service)) {
    return c.json({ error: '无效的服务名称' }, 400);
  }

  const body = await c.req.json();
  const { key, value, description, encrypt } = body;

  // 验证输入
  if (!isValidConfigKey(key)) {
    return c.json({ error: '无效的配置键' }, 400);
  }
  if (!isValidConfigValue(value)) {
    return c.json({ error: '配置值无效或过大（最大10KB）' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);
  const versionService = new VersionService(storage, encryption);

  try {
    // 检查配置是否已存在
    const exists = await storage.configExists(env, service, key);
    if (exists) {
      return c.json({ error: '配置已存在，请使用 PUT 方法更新' }, 409);
    }

    // 决定是否加密
    const shouldEncrypt = encrypt === true || encryption.shouldEncrypt(key);
    const finalValue = shouldEncrypt ? await encryption.encrypt(String(value)) : String(value);

    // 创建配置
    const config: ConfigItem = {
      key,
      value: finalValue,
      encrypted: shouldEncrypt,
      description: sanitizeInput(description || ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: getOperator(c),
    };

    // 保存配置
    await storage.saveConfig(env, service, key, config);

    // 创建版本记录
    const version = await versionService.createVersion(env, service, key, config, getOperator(c));

    // 记录审计日志
    const auditLog: AuditLog = {
      id: generateId(),
      environment: env,
      service,
      key,
      action: 'create',
      newValue: shouldEncrypt ? '[ENCRYPTED]' : String(value),
      operator: getOperator(c),
      timestamp: new Date().toISOString(),
      ip: getClientIP(c),
    };
    await storage.saveAuditLog(env, service, auditLog);

    return c.json({
      message: '配置创建成功',
      config: {
        ...config,
        value: shouldEncrypt ? '[ENCRYPTED]' : config.value,
      },
      version,
    }, 201);
  } catch (error) {
    return c.json({ error: `创建配置失败: ${error}` }, 500);
  }
}

/**
 * 更新配置
 */
export async function updateConfig(c: AppContext) {
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

  const body = await c.req.json();
  const { value, description, encrypt } = body;

  // 验证输入
  if (!isValidConfigValue(value)) {
    return c.json({ error: '配置值无效或过大（最大10KB）' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);
  const encryption = new EncryptionService(c.env.ENCRYPTION_KEY);
  const versionService = new VersionService(storage, encryption);

  try {
    // 获取现有配置
    const existingConfig = await storage.getConfig(env, service, key);
    if (!existingConfig) {
      return c.json({ error: '配置不存在，请使用 POST 方法创建' }, 404);
    }

    // 保存旧值用于审计
    const oldValue = existingConfig.encrypted 
      ? '[ENCRYPTED]' 
      : existingConfig.value;

    // 决定是否加密
    const shouldEncrypt = encrypt === true || encryption.shouldEncrypt(key);
    const finalValue = shouldEncrypt ? await encryption.encrypt(String(value)) : String(value);

    // 更新配置
    const updatedConfig: ConfigItem = {
      ...existingConfig,
      value: finalValue,
      encrypted: shouldEncrypt,
      description: description !== undefined ? sanitizeInput(description) : existingConfig.description,
      updatedAt: new Date().toISOString(),
    };

    // 保存配置
    await storage.saveConfig(env, service, key, updatedConfig);

    // 创建版本记录
    const version = await versionService.createVersion(env, service, key, updatedConfig, getOperator(c));

    // 记录审计日志
    const auditLog: AuditLog = {
      id: generateId(),
      environment: env,
      service,
      key,
      action: 'update',
      oldValue,
      newValue: shouldEncrypt ? '[ENCRYPTED]' : String(value),
      operator: getOperator(c),
      timestamp: new Date().toISOString(),
      ip: getClientIP(c),
    };
    await storage.saveAuditLog(env, service, auditLog);

    return c.json({
      message: '配置更新成功',
      config: {
        ...updatedConfig,
        value: shouldEncrypt ? '[ENCRYPTED]' : updatedConfig.value,
      },
      version,
    });
  } catch (error) {
    return c.json({ error: `更新配置失败: ${error}` }, 500);
  }
}

/**
 * 删除配置
 */
export async function deleteConfig(c: AppContext) {
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

  const storage = new StorageService(c.env.CONFIG_KV);

  try {
    // 检查配置是否存在
    const config = await storage.getConfig(env, service, key);
    if (!config) {
      return c.json({ error: '配置不存在' }, 404);
    }

    // 保存旧值用于审计
    const oldValue = config.encrypted ? '[ENCRYPTED]' : config.value;

    // 删除配置
    await storage.deleteConfig(env, service, key);

    // 记录审计日志
    const auditLog: AuditLog = {
      id: generateId(),
      environment: env,
      service,
      key,
      action: 'delete',
      oldValue,
      operator: getOperator(c),
      timestamp: new Date().toISOString(),
      ip: getClientIP(c),
    };
    await storage.saveAuditLog(env, service, auditLog);

    return c.json({
      message: '配置删除成功',
      deletedKey: key,
    });
  } catch (error) {
    return c.json({ error: `删除配置失败: ${error}` }, 500);
  }
}
