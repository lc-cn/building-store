// 环境管理处理器

import type { Context } from 'hono';
import type { Bindings, EnvironmentConfig, Environment } from '../types';
import { StorageService } from '../services/storage';
import { isValidEnvironment } from '../utils/validation';

type AppContext = Context<{ Bindings: Bindings; Variables: { user?: { id: string; name: string; role: string } } }>;

/**
 * 获取所有环境
 */
export async function listEnvironments(c: AppContext) {
  const storage = new StorageService(c.env.CONFIG_KV);

  try {
    const environments = await storage.listEnvironments();
    
    // 如果没有环境，返回默认环境列表
    if (environments.length === 0) {
      const defaultEnvironments: EnvironmentConfig[] = [
        {
          name: 'dev',
          displayName: '开发环境',
          description: '用于开发和测试',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
        {
          name: 'test',
          displayName: '测试环境',
          description: '用于集成测试和质量保证',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
        {
          name: 'prod',
          displayName: '生产环境',
          description: '生产环境配置',
          createdAt: new Date().toISOString(),
          isActive: true,
        },
      ];

      // 保存默认环境
      for (const env of defaultEnvironments) {
        await storage.saveEnvironment(env.name, env);
      }

      return c.json({
        environments: defaultEnvironments,
        count: defaultEnvironments.length,
      });
    }

    return c.json({
      environments,
      count: environments.length,
    });
  } catch (error) {
    return c.json({ error: `获取环境列表失败: ${error}` }, 500);
  }
}

/**
 * 获取单个环境
 */
export async function getEnvironment(c: AppContext) {
  const env = c.req.param('env');

  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);

  try {
    const environment = await storage.getEnvironment(env);
    
    if (!environment) {
      return c.json({ error: '环境不存在' }, 404);
    }

    return c.json(environment);
  } catch (error) {
    return c.json({ error: `获取环境失败: ${error}` }, 500);
  }
}

/**
 * 创建环境
 */
export async function createEnvironment(c: AppContext) {
  const body = await c.req.json();
  const { name, displayName, description } = body;

  if (!isValidEnvironment(name)) {
    return c.json({ error: '无效的环境名称，只支持 dev, test, prod' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);

  try {
    // 检查环境是否已存在
    const existing = await storage.getEnvironment(name);
    if (existing) {
      return c.json({ error: '环境已存在' }, 409);
    }

    const environmentConfig: EnvironmentConfig = {
      name,
      displayName: displayName || name,
      description: description || '',
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    await storage.saveEnvironment(name, environmentConfig);

    return c.json({
      message: '环境创建成功',
      environment: environmentConfig,
    }, 201);
  } catch (error) {
    return c.json({ error: `创建环境失败: ${error}` }, 500);
  }
}

/**
 * 更新环境
 */
export async function updateEnvironment(c: AppContext) {
  const env = c.req.param('env');

  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }

  const body = await c.req.json();
  const { displayName, description, isActive } = body;

  const storage = new StorageService(c.env.CONFIG_KV);

  try {
    // 获取现有环境
    const existing = (await storage.getEnvironment(env)) as EnvironmentConfig | null;
    if (!existing) {
      return c.json({ error: '环境不存在' }, 404);
    }

    const updatedEnvironment: EnvironmentConfig = {
      name: existing.name,
      createdAt: existing.createdAt,
      displayName: displayName !== undefined ? displayName : existing.displayName,
      description: description !== undefined ? description : existing.description,
      isActive: isActive !== undefined ? isActive : existing.isActive,
    };

    await storage.saveEnvironment(env, updatedEnvironment);

    return c.json({
      message: '环境更新成功',
      environment: updatedEnvironment,
    });
  } catch (error) {
    return c.json({ error: `更新环境失败: ${error}` }, 500);
  }
}

/**
 * 获取环境下的所有服务
 */
export async function getEnvironmentServices(c: AppContext) {
  const env = c.req.param('env');

  if (!isValidEnvironment(env)) {
    return c.json({ error: '无效的环境名称' }, 400);
  }

  const storage = new StorageService(c.env.CONFIG_KV);

  try {
    const services = await storage.getServices(env);

    return c.json({
      environment: env,
      services,
      count: services.length,
    });
  } catch (error) {
    return c.json({ error: `获取服务列表失败: ${error}` }, 500);
  }
}
