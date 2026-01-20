import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
  CACHE: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: 'user-service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '用户服务',
    version: '0.1.0',
    description: '用户注册、登录、权限管理',
    runtime: 'Cloudflare Workers',
    features: [
      '用户注册',
      '用户登录',
      'JWT认证',
      'RBAC权限管理',
      '用户信息管理'
    ]
  });
});

// 用户列表示例
app.get('/users', async (c) => {
  // 示例：从 D1 数据库查询
  // const result = await c.env.DB.prepare('SELECT * FROM users LIMIT 10').all();
  return c.json({
    users: [],
    message: '用户列表 - 待实现数据库查询'
  });
});

// 用户注册示例
app.post('/users/register', async (c) => {
  const body = await c.req.json();
  // 实现注册逻辑
  return c.json({
    message: '用户注册成功',
    userId: 'user_' + Date.now()
  }, 201);
});

export default app;
