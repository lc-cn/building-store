import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'notification-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '通知服务',
    version: '0.1.0',
    description: '邮件通知、短信通知、站内消息、推送通知',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
