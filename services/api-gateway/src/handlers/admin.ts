/**
 * 管理接口处理器
 */

import { Context } from 'hono';
import { Env, LoadBalancerType, AuthType } from '../types';
import { RouterService } from '../services/router';
import { getAggregatedMetrics } from '../utils/metrics';
import { CircuitBreakerMiddleware } from '../middleware/circuitBreaker';

/**
 * 管理路由处理器
 */
export class AdminHandler {
  /**
   * 获取所有路由
   */
  async getRoutes(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const router = new RouterService(env);
      const routes = await router.getAllRoutes();

      return c.json({
        success: true,
        data: {
          routes,
          total: routes.length,
        },
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取路由列表失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }

  /**
   * 获取单个路由
   */
  async getRoute(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const id = c.req.param('id');
      const router = new RouterService(env);
      const route = await router.getRouteById(id);

      if (!route) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '路由不存在',
          },
        }, 404);
      }

      return c.json({
        success: true,
        data: route,
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取路由失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }

  /**
   * 创建路由
   */
  async createRoute(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const body = await c.req.json();
      const router = new RouterService(env);

      // 验证路由配置
      const validation = router.validateRoute(body);
      if (!validation.valid) {
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '路由配置验证失败',
            details: validation.errors,
          },
        }, 400);
      }

      // 设置默认值
      const config = {
        path: body.path,
        methods: body.methods || ['*'],
        backends: body.backends,
        loadBalancer: body.loadBalancer || LoadBalancerType.ROUND_ROBIN,
        authentication: body.authentication || {
          type: AuthType.NONE,
          required: false,
        },
        rateLimit: body.rateLimit,
        circuitBreaker: body.circuitBreaker,
        timeout: body.timeout || 30000,
        retries: body.retries || 0,
        rewrite: body.rewrite,
        enabled: body.enabled !== false,
      };

      const route = await router.createRoute(config);

      return c.json({
        success: true,
        data: route,
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '创建路由失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }

  /**
   * 更新路由
   */
  async updateRoute(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const router = new RouterService(env);

      // 验证路由配置
      const validation = router.validateRoute(body);
      if (!validation.valid) {
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '路由配置验证失败',
            details: validation.errors,
          },
        }, 400);
      }

      const route = await router.updateRoute(id, body);

      if (!route) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '路由不存在',
          },
        }, 404);
      }

      return c.json({
        success: true,
        data: route,
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '更新路由失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }

  /**
   * 删除路由
   */
  async deleteRoute(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const id = c.req.param('id');
      const router = new RouterService(env);
      const deleted = await router.deleteRoute(id);

      if (!deleted) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '路由不存在',
          },
        }, 404);
      }

      return c.json({
        success: true,
        data: {
          message: '路由删除成功',
        },
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '删除路由失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }

  /**
   * 获取指标数据
   */
  async getMetrics(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const metrics = await getAggregatedMetrics(env);

      return c.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取指标失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const router = new RouterService(env);
      const routes = await router.getAllRoutes();
      const enabledRoutes = routes.filter(r => r.enabled);

      return c.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: Date.now(),
          routes: {
            total: routes.length,
            enabled: enabledRoutes.length,
          },
        },
      });
    } catch (error) {
      return c.json({
        success: false,
        data: {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : undefined,
        },
      }, 503);
    }
  }

  /**
   * 重置熔断器
   */
  async resetCircuitBreaker(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const serviceId = c.req.param('service');
      
      // 获取路由配置
      const router = new RouterService(env);
      const route = await router.getRouteById(serviceId);

      if (!route) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '服务不存在',
          },
        }, 404);
      }

      if (!route.circuitBreaker) {
        return c.json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: '该服务未配置熔断器',
          },
        }, 400);
      }

      // 重置熔断器
      const breaker = new CircuitBreakerMiddleware(env, route.circuitBreaker);
      await breaker.reset(serviceId);

      return c.json({
        success: true,
        data: {
          message: '熔断器重置成功',
        },
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '重置熔断器失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }

  /**
   * 获取熔断器状态
   */
  async getCircuitBreakerStats(c: Context): Promise<Response> {
    const env = c.env as Env;
    
    try {
      const serviceId = c.req.param('service');
      
      // 获取路由配置
      const router = new RouterService(env);
      const route = await router.getRouteById(serviceId);

      if (!route) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '服务不存在',
          },
        }, 404);
      }

      if (!route.circuitBreaker) {
        return c.json({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: '该服务未配置熔断器',
          },
        }, 400);
      }

      // 获取熔断器状态
      const breaker = new CircuitBreakerMiddleware(env, route.circuitBreaker);
      const stats = await breaker.getStats(serviceId);

      return c.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取熔断器状态失败',
          details: error instanceof Error ? error.message : undefined,
        },
      }, 500);
    }
  }
}

/**
 * 创建管理处理器实例
 */
export function createAdminHandler(): AdminHandler {
  return new AdminHandler();
}
