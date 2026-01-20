import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8007;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

// 路由
app.get('/', (req, res) => {
  res.json({
    service: '通知服务',
    version: '0.1.0',
    description: '邮件通知、短信通知、站内消息、推送通知',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`通知服务 运行在端口 ${PORT}`);
});

export default app;
