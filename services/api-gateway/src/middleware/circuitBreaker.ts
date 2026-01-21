/**
 * 熔断器中间件
 */

import { Context, Next } from 'hono';
import { 
  Env, 
  CircuitBreakerConfig, 
  CircuitBreakerData, 
  CircuitBreakerState 
} from '../types';
import { RouterService } from '../services/router';

/**
 * 熔断器中间件
 */
export function circuitBreaker() {
  return async (c: Context, next: Next) => {
    const env = c.env as Env;
    const router = new RouterService(env);
    
    // 获取路由配置
    const routeConfig = await router.matchRoute(c.req.path, c.req.method);
    
    // 如果没有配置熔断器，跳过
    if (!routeConfig?.circuitBreaker) {
      return next();
    }

    const config = routeConfig.circuitBreaker;
    const breaker = new CircuitBreakerMiddleware(env, config);
    const serviceId = routeConfig.id;

    // 检查熔断器状态
    const state = await breaker.getState(serviceId);

    if (state === CircuitBreakerState.OPEN) {
      return c.json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: '服务暂时不可用，请稍后再试',
          details: '熔断器已打开',
        },
      }, 503);
    }

    try {
      await next();

      // 请求成功
      if (c.res.status < 500) {
        await breaker.recordSuccess(serviceId);
      } else {
        await breaker.recordFailure(serviceId);
      }
    } catch (error) {
      // 请求失败
      await breaker.recordFailure(serviceId);
      throw error;
    }
  };
}

/**
 * 熔断器管理器
 */
export class CircuitBreakerMiddleware {
  constructor(
    private env: Env,
    private config: CircuitBreakerConfig
  ) {}

  /**
   * 获取熔断器状态
   */
  async getState(serviceId: string): Promise<CircuitBreakerState> {
    const data = await this.getData(serviceId);
    const now = Date.now();

    // 如果是打开状态，检查是否可以进入半开状态
    if (data.state === CircuitBreakerState.OPEN) {
      if (data.nextAttemptTime && now >= data.nextAttemptTime) {
        await this.transitionToHalfOpen(serviceId);
        return CircuitBreakerState.HALF_OPEN;
      }
      return CircuitBreakerState.OPEN;
    }

    return data.state;
  }

  /**
   * 记录成功
   */
  async recordSuccess(serviceId: string): Promise<void> {
    const data = await this.getData(serviceId);

    if (data.state === CircuitBreakerState.HALF_OPEN) {
      data.successes++;

      // 如果达到成功阈值，关闭熔断器
      if (data.successes >= this.config.successThreshold) {
        await this.transitionToClosed(serviceId);
      } else {
        await this.saveData(serviceId, data);
      }
    } else if (data.state === CircuitBreakerState.CLOSED) {
      // 重置失败计数
      data.failures = 0;
      await this.saveData(serviceId, data);
    }
  }

  /**
   * 记录失败
   */
  async recordFailure(serviceId: string): Promise<void> {
    const data = await this.getData(serviceId);
    const now = Date.now();

    data.failures++;
    data.lastFailureTime = now;

    if (data.state === CircuitBreakerState.HALF_OPEN) {
      // 半开状态下失败，立即打开熔断器
      await this.transitionToOpen(serviceId, data);
    } else if (data.state === CircuitBreakerState.CLOSED) {
      // 检查是否达到失败阈值
      const totalRequests = data.failures + data.successes;
      const failureRate = totalRequests > 0 ? data.failures / totalRequests : 0;

      if (failureRate >= this.config.failureThreshold) {
        await this.transitionToOpen(serviceId, data);
      } else {
        await this.saveData(serviceId, data);
      }
    } else {
      await this.saveData(serviceId, data);
    }
  }

  /**
   * 转换到关闭状态
   */
  private async transitionToClosed(serviceId: string): Promise<void> {
    const data: CircuitBreakerData = {
      state: CircuitBreakerState.CLOSED,
      failures: 0,
      successes: 0,
    };
    await this.saveData(serviceId, data);
  }

  /**
   * 转换到打开状态
   */
  private async transitionToOpen(serviceId: string, data: CircuitBreakerData): Promise<void> {
    const now = Date.now();
    data.state = CircuitBreakerState.OPEN;
    data.nextAttemptTime = now + this.config.timeout;
    await this.saveData(serviceId, data);
  }

  /**
   * 转换到半开状态
   */
  private async transitionToHalfOpen(serviceId: string): Promise<void> {
    const data: CircuitBreakerData = {
      state: CircuitBreakerState.HALF_OPEN,
      failures: 0,
      successes: 0,
    };
    await this.saveData(serviceId, data);
  }

  /**
   * 获取熔断器数据
   */
  private async getData(serviceId: string): Promise<CircuitBreakerData> {
    const key = `circuit:${serviceId}`;
    const stored = await this.env.CIRCUIT_BREAKER.get(key);

    if (stored) {
      return JSON.parse(stored);
    }

    return {
      state: CircuitBreakerState.CLOSED,
      failures: 0,
      successes: 0,
    };
  }

  /**
   * 保存熔断器数据
   */
  private async saveData(serviceId: string, data: CircuitBreakerData): Promise<void> {
    const key = `circuit:${serviceId}`;
    await this.env.CIRCUIT_BREAKER.put(key, JSON.stringify(data), {
      expirationTtl: 86400, // 24小时
    });
  }

  /**
   * 重置熔断器
   */
  async reset(serviceId: string): Promise<void> {
    await this.transitionToClosed(serviceId);
  }

  /**
   * 获取熔断器统计
   */
  async getStats(serviceId: string): Promise<CircuitBreakerData> {
    return this.getData(serviceId);
  }
}
