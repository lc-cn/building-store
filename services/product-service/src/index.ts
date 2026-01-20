import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'product-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '产品服务',
    version: '0.1.0',
    description: '产品目录管理、分类管理、产品搜索、价格管理',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
