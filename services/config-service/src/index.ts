import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Bindings, RequestContext } from './types';

// 导入处理器
import {
  getConfig,
  getServiceConfigs,
  createConfig,
  updateConfig,
  deleteConfig,
} from './handlers/config';

import {
  listEnvironments,
  getEnvironment,
  createEnvironment,
  updateEnvironment,
  getEnvironmentServices,
} from './handlers/environment';

import {
  getVersionHistory,
  getVersionDetail,
  rollbackToVersion,
  compareVersions,
  getAuditLogs,
} from './handlers/version';

// 导入中间件
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth';

// 创建应用
const app = new Hono<{ 
  Bindings: Bindings; 
  Variables: { user?: RequestContext['user'] } 
}>();

// 全局中间件
app.use('/*', cors());

// ==================== 基础路由 ====================

app.get('/', (c) => {
  return c.json({
    service: '配置中心服务',
    version: '1.0.0',
    description: '集中配置管理、版本控制、动态配置更新',
    runtime: 'Cloudflare Workers',
    features: [
      '配置的增删改查',
      '配置版本控制',
      '配置历史记录',
      '配置回滚',
      '多环境支持',
      '配置加密',
      '审计日志',
      '实时配置订阅（SSE）',
    ],
    endpoints: {
      config: {
        get: 'GET /config/:env/:service/:key',
        getAll: 'GET /config/:env/:service',
        create: 'POST /config/:env/:service',
        update: 'PUT /config/:env/:service/:key',
        delete: 'DELETE /config/:env/:service/:key',
      },
      environment: {
        list: 'GET /environments',
        get: 'GET /environments/:env',
        create: 'POST /environments',
        update: 'PUT /environments/:env',
        services: 'GET /environments/:env/services',
      },
      version: {
        history: 'GET /versions/:env/:service/:key',
        detail: 'GET /versions/:env/:service/:key/:version',
        rollback: 'POST /versions/:env/:service/:key/rollback/:version',
        compare: 'GET /versions/:env/:service/:key/compare',
      },
      audit: {
        logs: 'GET /audit/:env/:service',
      },
      subscribe: {
        sse: 'GET /subscribe/:env/:service',
      },
    },
  });
});

app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'config-service',
    timestamp: new Date().toISOString(),
  });
});

// ==================== 配置管理路由 ====================

// 获取单个配置（可选认证，用于读取）
app.get('/config/:env/:service/:key', optionalAuthMiddleware, getConfig);

// 获取服务的所有配置（可选认证）
app.get('/config/:env/:service', optionalAuthMiddleware, getServiceConfigs);

// 创建配置（需要认证）
app.post('/config/:env/:service', authMiddleware, createConfig);

// 更新配置（需要认证）
app.put('/config/:env/:service/:key', authMiddleware, updateConfig);

// 删除配置（需要认证）
app.delete('/config/:env/:service/:key', authMiddleware, deleteConfig);

// ==================== 环境管理路由 ====================

// 获取所有环境
app.get('/environments', listEnvironments);

// 获取单个环境
app.get('/environments/:env', getEnvironment);

// 创建环境（需要认证）
app.post('/environments', authMiddleware, createEnvironment);

// 更新环境（需要认证）
app.put('/environments/:env', authMiddleware, updateEnvironment);

// 获取环境下的所有服务
app.get('/environments/:env/services', getEnvironmentServices);

// ==================== 版本管理路由 ====================

// 获取配置的版本历史
app.get('/versions/:env/:service/:key', optionalAuthMiddleware, getVersionHistory);

// 获取特定版本的详情
app.get('/versions/:env/:service/:key/:version', optionalAuthMiddleware, getVersionDetail);

// 回滚到指定版本（需要认证）
app.post('/versions/:env/:service/:key/rollback/:version', authMiddleware, rollbackToVersion);

// 比较两个版本
app.get('/versions/:env/:service/:key/compare', optionalAuthMiddleware, compareVersions);

// ==================== 审计日志路由 ====================

// 获取审计日志（需要认证）
app.get('/audit/:env/:service', authMiddleware, getAuditLogs);

// ==================== 配置订阅路由（SSE） ====================

// Server-Sent Events 实时推送
app.get('/subscribe/:env/:service', optionalAuthMiddleware, async (c) => {
  const env = c.req.param('env');
  const service = c.req.param('service');

  // 创建 SSE 流
  const stream = new ReadableStream({
    start(controller) {
      // 发送初始连接消息
      const encoder = new TextEncoder();
      const message = `data: ${JSON.stringify({
        type: 'connected',
        environment: env,
        service,
        timestamp: new Date().toISOString(),
      })}\n\n`;
      controller.enqueue(encoder.encode(message));

      // 定期发送心跳
      const heartbeat = setInterval(() => {
        const heartbeatMsg = `data: ${JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(encoder.encode(heartbeatMsg));
      }, 30000); // 每30秒发送一次心跳

      // 注意：在 Cloudflare Workers 中，SSE 的实现有限制
      // 实际生产环境可能需要使用 Durable Objects 或其他方案
      // 这里只是演示基本的 SSE 响应格式

      // 清理函数
      setTimeout(() => {
        clearInterval(heartbeat);
        controller.close();
      }, 300000); // 5分钟后关闭连接
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

// ==================== 错误处理 ====================

app.notFound((c) => {
  return c.json({
    error: '路由不存在',
    path: c.req.path,
    method: c.req.method,
  }, 404);
});

app.onError((err, c) => {
  console.error('服务器错误:', err);
  return c.json({
    error: '服务器内部错误',
    message: err.message,
  }, 500);
});

export default app;
