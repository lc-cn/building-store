/**
 * 限流中间件
 */

import { Context, Next } from 'hono';
import { Env, RateLimitConfig, RateLimitData } from '../types';
import { getClientIp } from '../utils/metrics';
import { RouterService } from '../services/router';

/**
 * 限流中间件
 */
export function rateLimit() {
  return async (c: Context, next: Next) => {
    const env = c.env as Env;
    const router = new RouterService(env);
    
    // 获取路由配置
    const routeConfig = await router.matchRoute(c.req.path, c.req.method);
    
    // 如果没有配置限流，跳过
    if (!routeConfig?.rateLimit) {
      return next();
    }

    const config = routeConfig.rateLimit;
    const identifier = getIdentifier(c);
    const now = Date.now();
    const windowStart = getWindowStart(now, config.windowMs);
    const key = getRateLimitKey(identifier, routeConfig.id, windowStart);

    // 获取当前窗口的请求计数
    const data = await getRateLimitData(env, key);

    // 检查是否超过限制
    if (data.count >= config.maxRequests) {
      const retryAfter = Math.ceil((data.resetAt - now) / 1000);
      
      c.header('X-RateLimit-Limit', config.maxRequests.toString());
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', data.resetAt.toString());
      c.header('Retry-After', retryAfter.toString());

      return c.json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '请求过于频繁，请稍后再试',
          details: {
            limit: config.maxRequests,
            windowMs: config.windowMs,
            retryAfter,
          },
        },
      }, 429);
    }

    // 增加计数
    await incrementRateLimit(env, key, data, config.windowMs);

    // 设置响应头
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', (config.maxRequests - data.count - 1).toString());
    c.header('X-RateLimit-Reset', data.resetAt.toString());

    await next();
  };
}

/**
 * 获取限流标识符
 */
function getIdentifier(c: Context): string {
  // 使用IP地址作为标识符
  return `ip:${getClientIp(c.req.raw)}`;
}

/**
 * 获取时间窗口起始时间
 */
function getWindowStart(now: number, windowMs: number): number {
  return Math.floor(now / windowMs) * windowMs;
}

/**
 * 生成限流键
 */
function getRateLimitKey(identifier: string, routeId: string, windowStart: number): string {
  return `ratelimit:${identifier}:${routeId}:${windowStart}`;
}

/**
 * 获取限流数据
 */
async function getRateLimitData(env: Env, key: string): Promise<RateLimitData> {
  const stored = await env.RATE_LIMIT.get(key);
  
  if (stored) {
    return JSON.parse(stored);
  }

  return {
    count: 0,
    resetAt: Date.now(),
  };
}

/**
 * 增加限流计数
 */
async function incrementRateLimit(
  env: Env,
  key: string,
  data: RateLimitData,
  windowMs: number
): Promise<void> {
  const now = Date.now();
  
  const updated: RateLimitData = {
    count: data.count + 1,
    resetAt: data.resetAt || now + windowMs,
  };

  const ttl = Math.ceil((updated.resetAt - now) / 1000);

  await env.RATE_LIMIT.put(key, JSON.stringify(updated), {
    expirationTtl: ttl > 0 ? ttl : 1,
  });
}
