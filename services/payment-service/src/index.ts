import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'payment-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '支付服务',
    version: '0.1.0',
    description: '支付处理、退款处理、支付回调、账单管理',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
