import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  REGISTRY: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/health', (c) => {
  return c.json({ status: 'healthy', service: 'service-registry' });
});

app.get('/', (c) => {
  return c.json({
    service: '服务注册与发现',
    description: '服务注册、服务发现、健康检查',
    runtime: 'Cloudflare Workers'
  });
});

// 注册服务
app.post('/register', async (c) => {
  const body = await c.req.json();
  const { serviceName, serviceUrl } = body;
  await c.env.REGISTRY.put(serviceName, JSON.stringify({ url: serviceUrl, timestamp: Date.now() }));
  return c.json({ message: '服务注册成功', serviceName });
});

// 发现服务
app.get('/discover/:serviceName', async (c) => {
  const serviceName = c.req.param('serviceName');
  const serviceInfo = await c.env.REGISTRY.get(serviceName);
  if (!serviceInfo) {
    return c.json({ error: '服务不存在' }, 404);
  }
  return c.json({ serviceName, info: JSON.parse(serviceInfo) });
});

export default app;
