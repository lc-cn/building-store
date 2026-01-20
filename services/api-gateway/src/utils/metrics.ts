/**
 * 指标统计工具
 */

import { Env, Metrics, RequestLog } from '../types';

/**
 * 记录请求日志
 */
export async function recordRequest(
  env: Env,
  log: RequestLog
): Promise<void> {
  try {
    // 存储最近的请求日志（保留1小时）
    const key = `log:${log.timestamp}:${log.id}`;
    await env.METRICS.put(key, JSON.stringify(log), {
      expirationTtl: 3600, // 1小时后过期
    });

    // 更新计数器
    await updateMetrics(env, log);
  } catch (error) {
    console.error('记录请求失败:', error);
  }
}

/**
 * 更新指标
 */
async function updateMetrics(env: Env, log: RequestLog): Promise<void> {
  const now = Date.now();
  const windowKey = getMetricsWindow(now);
  
  // 获取当前窗口的指标
  let metrics = await getMetrics(env, windowKey);
  
  // 更新总请求数
  metrics.totalRequests++;
  
  // 更新成功/失败计数
  if (log.status >= 200 && log.status < 400) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }
  
  // 按路由统计
  if (log.routeId) {
    metrics.requestsByRoute[log.routeId] = 
      (metrics.requestsByRoute[log.routeId] || 0) + 1;
  }
  
  // 按状态码统计
  metrics.requestsByStatus[log.status] = 
    (metrics.requestsByStatus[log.status] || 0) + 1;
  
  // 更新延迟（简化版，实际应该维护一个延迟列表）
  const totalLatency = metrics.averageLatency * (metrics.totalRequests - 1);
  metrics.averageLatency = (totalLatency + log.duration) / metrics.totalRequests;
  
  // 更新错误率
  metrics.errorRate = metrics.failedRequests / metrics.totalRequests;
  
  // 保存指标
  await env.METRICS.put(
    `metrics:${windowKey}`,
    JSON.stringify(metrics),
    { expirationTtl: 86400 } // 保留24小时
  );
}

/**
 * 获取指标数据
 */
async function getMetrics(env: Env, windowKey: string): Promise<Metrics> {
  const stored = await env.METRICS.get(`metrics:${windowKey}`);
  
  if (stored) {
    return JSON.parse(stored);
  }
  
  return {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    requestsByRoute: {},
    requestsByStatus: {},
    errorRate: 0,
  };
}

/**
 * 获取指标时间窗口（5分钟）
 */
function getMetricsWindow(timestamp: number): string {
  const windowSize = 5 * 60 * 1000; // 5分钟
  const window = Math.floor(timestamp / windowSize) * windowSize;
  return window.toString();
}

/**
 * 获取聚合指标（最近1小时）
 */
export async function getAggregatedMetrics(env: Env): Promise<Metrics> {
  const now = Date.now();
  const windowSize = 5 * 60 * 1000; // 5分钟
  const windows = 12; // 最近12个窗口（1小时）
  
  const aggregated: Metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    requestsByRoute: {},
    requestsByStatus: {},
    errorRate: 0,
  };
  
  let totalLatency = 0;
  
  // 聚合最近的时间窗口
  for (let i = 0; i < windows; i++) {
    const windowTime = now - (i * windowSize);
    const windowKey = getMetricsWindow(windowTime);
    const metrics = await getMetrics(env, windowKey);
    
    aggregated.totalRequests += metrics.totalRequests;
    aggregated.successfulRequests += metrics.successfulRequests;
    aggregated.failedRequests += metrics.failedRequests;
    totalLatency += metrics.averageLatency * metrics.totalRequests;
    
    // 合并路由统计
    for (const [route, count] of Object.entries(metrics.requestsByRoute)) {
      aggregated.requestsByRoute[route] = 
        (aggregated.requestsByRoute[route] || 0) + count;
    }
    
    // 合并状态码统计
    for (const [status, count] of Object.entries(metrics.requestsByStatus)) {
      aggregated.requestsByStatus[Number(status)] = 
        (aggregated.requestsByStatus[Number(status)] || 0) + count;
    }
  }
  
  // 计算平均延迟
  if (aggregated.totalRequests > 0) {
    aggregated.averageLatency = totalLatency / aggregated.totalRequests;
    aggregated.errorRate = aggregated.failedRequests / aggregated.totalRequests;
  }
  
  return aggregated;
}

/**
 * 生成唯一请求ID
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 获取客户端IP
 */
export function getClientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ||
         request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         '0.0.0.0';
}
