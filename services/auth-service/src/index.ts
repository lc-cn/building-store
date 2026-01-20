import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8006;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

// 路由
app.get('/', (req, res) => {
  res.json({
    service: '认证服务',
    version: '0.1.0',
    description: 'JWT令牌生成、令牌验证、OAuth2.0、单点登录',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`认证服务 运行在端口 ${PORT}`);
});

export default app;
