import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8004;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'inventory-service' });
});

// 路由
app.get('/', (req, res) => {
  res.json({
    service: '库存服务',
    version: '0.1.0',
    description: '库存管理、库存预留、库存释放、库存同步',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`库存服务 运行在端口 ${PORT}`);
});

export default app;
