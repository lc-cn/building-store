import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 限流
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: '请求过于频繁，请稍后再试',
});
app.use(limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api-gateway' });
});

// 路由代理配置
const services = {
  '/api/v1/users': 'http://localhost:8001',
  '/api/v1/products': 'http://localhost:8002',
  '/api/v1/orders': 'http://localhost:8003',
  '/api/v1/inventory': 'http://localhost:8004',
  '/api/v1/payments': 'http://localhost:8005',
  '/api/v1/auth': 'http://localhost:8006',
  '/api/v1/notifications': 'http://localhost:8007',
};

// 配置代理
Object.entries(services).forEach(([path, target]) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^${path}`]: '',
      },
    })
  );
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    service: 'API 网关',
    version: '0.1.0',
    description: '统一入口、路由转发、负载均衡、限流熔断',
    routes: Object.keys(services),
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`API 网关运行在端口 ${PORT}`);
});

export default app;
