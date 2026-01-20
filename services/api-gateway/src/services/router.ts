/**
 * 路由服务
 */

import { Env, RouteConfig } from '../types';
import { CacheManager } from '../utils/cache';

/**
 * 路由管理器
 */
export class RouterService {
  private cache: CacheManager;

  constructor(private env: Env) {
    this.cache = new CacheManager(env);
  }

  /**
   * 获取所有路由
   */
  async getAllRoutes(): Promise<RouteConfig[]> {
    const keys = await this.cache.list(this.env.ROUTES, 'route:');
    const routes: RouteConfig[] = [];

    for (const key of keys) {
      const route = await this.cache.get<RouteConfig>(this.env.ROUTES, key);
      if (route) {
        routes.push(route);
      }
    }

    return routes.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * 根据ID获取路由
   */
  async getRouteById(id: string): Promise<RouteConfig | null> {
    return this.cache.get<RouteConfig>(this.env.ROUTES, `route:${id}`);
  }

  /**
   * 匹配路由
   */
  async matchRoute(path: string, method: string): Promise<RouteConfig | null> {
    const routes = await this.getAllRoutes();

    for (const route of routes) {
      if (!route.enabled) {
        continue;
      }

      // 检查方法是否匹配
      if (!route.methods.includes(method) && !route.methods.includes('*')) {
        continue;
      }

      // 检查路径是否匹配
      if (this.matchPath(route.path, path)) {
        return route;
      }
    }

    return null;
  }

  /**
   * 路径匹配（支持通配符）
   */
  private matchPath(pattern: string, path: string): boolean {
    // 将路径模式转换为正则表达式
    // 支持 * (匹配单个路径段) 和 ** (匹配多个路径段)
    const regexPattern = pattern
      .replace(/\*\*/g, '____DOUBLE_STAR____')
      .replace(/\*/g, '[^/]+')
      .replace(/____DOUBLE_STAR____/g, '.*')
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * 创建路由
   */
  async createRoute(config: Omit<RouteConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<RouteConfig> {
    const now = Date.now();
    const route: RouteConfig = {
      ...config,
      id: this.generateRouteId(),
      createdAt: now,
      updatedAt: now,
    };

    await this.cache.set(
      this.env.ROUTES,
      `route:${route.id}`,
      route
    );

    return route;
  }

  /**
   * 更新路由
   */
  async updateRoute(id: string, updates: Partial<RouteConfig>): Promise<RouteConfig | null> {
    const route = await this.getRouteById(id);
    
    if (!route) {
      return null;
    }

    const updated: RouteConfig = {
      ...route,
      ...updates,
      id, // 保持ID不变
      createdAt: route.createdAt, // 保持创建时间不变
      updatedAt: Date.now(),
    };

    await this.cache.set(
      this.env.ROUTES,
      `route:${id}`,
      updated
    );

    return updated;
  }

  /**
   * 删除路由
   */
  async deleteRoute(id: string): Promise<boolean> {
    const route = await this.getRouteById(id);
    
    if (!route) {
      return false;
    }

    await this.cache.delete(this.env.ROUTES, `route:${id}`);
    return true;
  }

  /**
   * 生成路由ID
   */
  private generateRouteId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 应用路径重写
   */
  applyRewrite(path: string, route: RouteConfig): string {
    if (!route.rewrite) {
      return path;
    }

    const { from, to } = route.rewrite;
    
    // 简单的字符串替换（实际应该支持正则表达式和捕获组）
    return path.replace(new RegExp(from), to);
  }

  /**
   * 验证路由配置
   */
  validateRoute(config: Partial<RouteConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.path) {
      errors.push('路径不能为空');
    }

    if (!config.methods || config.methods.length === 0) {
      errors.push('至少需要指定一个HTTP方法');
    }

    if (!config.backends || config.backends.length === 0) {
      errors.push('至少需要指定一个后端服务');
    }

    if (config.backends) {
      for (const backend of config.backends) {
        if (!backend.url) {
          errors.push(`后端服务 ${backend.id} 缺少URL`);
        }
        if (backend.weight !== undefined && backend.weight < 0) {
          errors.push(`后端服务 ${backend.id} 权重不能为负数`);
        }
      }
    }

    if (config.timeout !== undefined && config.timeout < 0) {
      errors.push('超时时间不能为负数');
    }

    if (config.retries !== undefined && config.retries < 0) {
      errors.push('重试次数不能为负数');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
