import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'inventory-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '库存服务',
    version: '0.1.0',
    description: '库存管理、库存预留、库存释放、库存同步',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
