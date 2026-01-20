import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8005;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

// 路由
app.get('/', (req, res) => {
  res.json({
    service: '支付服务',
    version: '0.1.0',
    description: '支付处理、退款处理、支付回调、账单管理',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`支付服务 运行在端口 ${PORT}`);
});

export default app;
