import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  CONFIG: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/health', (c) => {
  return c.json({ status: 'healthy', service: 'config-service' });
});

app.get('/', (c) => {
  return c.json({
    service: '配置中心',
    description: '集中配置管理、动态配置更新',
    runtime: 'Cloudflare Workers'
  });
});

// 获取配置
app.get('/config/:key', async (c) => {
  const key = c.req.param('key');
  const value = await c.env.CONFIG.get(key);
  if (!value) {
    return c.json({ error: '配置不存在' }, 404);
  }
  return c.json({ key, value });
});

export default app;
