/**
 * 日志中间件
 */

import { Context, Next } from 'hono';
import { Env, RequestLog } from '../types';
import { recordRequest, generateRequestId, getClientIp } from '../utils/metrics';

/**
 * 请求日志中间件
 */
export function logger() {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const requestId = generateRequestId();

    // 设置请求ID和开始时间到上下文
    c.set('requestId', requestId);
    c.set('startTime', startTime);

    // 添加请求ID到响应头
    c.header('X-Request-Id', requestId);

    try {
      await next();
    } finally {
      // 记录请求日志
      const duration = Date.now() - startTime;
      const routeConfig = c.get('routeConfig');
      const env = c.env as Env;

      const log: RequestLog = {
        id: requestId,
        method: c.req.method,
        path: c.req.path,
        routeId: routeConfig?.id,
        status: c.res.status,
        duration,
        timestamp: startTime,
        ip: getClientIp(c.req.raw),
        userAgent: c.req.header('user-agent'),
      };

      // 异步记录日志（不阻塞响应）
      c.executionCtx.waitUntil(recordRequest(env, log));

      // 控制台日志
      console.log(formatLog(log));
    }
  };
}

/**
 * 格式化日志
 */
function formatLog(log: RequestLog): string {
  const parts = [
    `[${new Date(log.timestamp).toISOString()}]`,
    log.method,
    log.path,
    `${log.status}`,
    `${log.duration}ms`,
  ];

  if (log.routeId) {
    parts.push(`route:${log.routeId}`);
  }

  if (log.error) {
    parts.push(`error:${log.error}`);
  }

  return parts.join(' ');
}

/**
 * 错误日志中间件
 */
export function errorLogger() {
  return async (c: Context, next: Next) => {
    try {
      await next();
    } catch (error) {
      const requestId = c.get('requestId') || generateRequestId();
      const startTime = c.get('startTime') || Date.now();
      const duration = Date.now() - startTime;
      const env = c.env as Env;

      const errorLog: RequestLog = {
        id: requestId,
        method: c.req.method,
        path: c.req.path,
        status: 500,
        duration,
        timestamp: startTime,
        ip: getClientIp(c.req.raw),
        error: error instanceof Error ? error.message : String(error),
      };

      // 记录错误日志
      c.executionCtx.waitUntil(recordRequest(env, errorLog));

      // 控制台错误日志
      console.error('请求错误:', formatLog(errorLog));
      console.error('堆栈:', error);

      // 返回错误响应
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '服务器内部错误',
          details: error instanceof Error ? error.message : undefined,
        },
        metadata: {
          timestamp: Date.now(),
          requestId,
        },
      }, 500);
    }
  };
}

/**
 * 访问日志格式化器
 */
export class AccessLogger {
  private logs: RequestLog[] = [];

  /**
   * 添加日志
   */
  add(log: RequestLog): void {
    this.logs.push(log);
    
    // 限制内存中保留的日志数量
    if (this.logs.length > 1000) {
      this.logs.shift();
    }
  }

  /**
   * 获取最近的日志
   */
  getRecent(count: number = 100): RequestLog[] {
    return this.logs.slice(-count);
  }

  /**
   * 按条件过滤日志
   */
  filter(predicate: (log: RequestLog) => boolean): RequestLog[] {
    return this.logs.filter(predicate);
  }

  /**
   * 获取错误日志
   */
  getErrors(): RequestLog[] {
    return this.filter(log => log.status >= 400);
  }

  /**
   * 获取慢请求日志
   */
  getSlowRequests(threshold: number = 1000): RequestLog[] {
    return this.filter(log => log.duration > threshold);
  }

  /**
   * 清除日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 导出日志为JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
