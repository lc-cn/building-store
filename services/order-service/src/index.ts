import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'order-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '订单服务',
    version: '0.1.0',
    description: '订单创建、订单状态管理、订单查询、订单历史',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
