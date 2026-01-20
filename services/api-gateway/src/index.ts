import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'api-gateway',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: 'API网关',
    version: '0.1.0',
    description: '路由转发、负载均衡、限流熔断、统一认证',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
