/**
 * API网关主入口
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { logger, errorLogger } from './middleware/logger';
import { jwtAuth, adminAuth } from './middleware/auth';
import { rateLimit } from './middleware/ratelimit';
import { circuitBreaker } from './middleware/circuitBreaker';
import { createProxyHandler } from './handlers/proxy';
import { createAdminHandler } from './handlers/admin';

// 创建Hono应用
type HonoEnv = { Bindings: Env };
const app = new Hono<HonoEnv>();

// 创建处理器实例
const proxyHandler = createProxyHandler();
const adminHandler = createAdminHandler();

// 全局中间件
app.use('*', cors());
app.use('*', errorLogger());
app.use('*', logger());

// 管理接口路由（需要管理员权限）
const admin = new Hono<HonoEnv>();
admin.use('*', adminAuth());

// 路由管理
admin.get('/routes', (c) => adminHandler.getRoutes(c));
admin.get('/routes/:id', (c) => adminHandler.getRoute(c));
admin.post('/routes', (c) => adminHandler.createRoute(c));
admin.put('/routes/:id', (c) => adminHandler.updateRoute(c));
admin.delete('/routes/:id', (c) => adminHandler.deleteRoute(c));

// 指标和监控
admin.get('/metrics', (c) => adminHandler.getMetrics(c));
admin.get('/health', (c) => adminHandler.healthCheck(c));

// 熔断器管理
admin.post('/circuit-breaker/reset/:service', (c) => adminHandler.resetCircuitBreaker(c));
admin.get('/circuit-breaker/stats/:service', (c) => adminHandler.getCircuitBreakerStats(c));

// 负载均衡统计
admin.get('/load-balancer/stats', (c) => {
  const stats = proxyHandler.getStats();
  return c.json({
    success: true,
    data: stats,
  });
});

// 挂载管理路由
app.route('/admin', admin);

// 应用API中间件和路由
app.use('/api/*', jwtAuth());
app.use('/api/*', rateLimit());
app.use('/api/*', circuitBreaker());

// 代理转发
app.all('/api/*', (c) => proxyHandler.handle(c));

// 根路径
app.get('/', (c) => {
  return c.json({
    success: true,
    data: {
      name: 'Building Store API Gateway',
      version: '1.0.0',
      timestamp: Date.now(),
      endpoints: {
        admin: '/admin',
        api: '/api',
      },
    },
  });
});

// 404处理
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在',
    },
  }, 404);
});

// 错误处理
app.onError((err, c) => {
  console.error('未处理的错误:', err);
  
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: '服务器内部错误',
      details: err.message,
    },
  }, 500);
});

export default app;
