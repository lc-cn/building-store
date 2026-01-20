import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'auth-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '认证服务',
    version: '0.1.0',
    description: 'JWT令牌生成、令牌验证、OAuth2.0、单点登录',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
