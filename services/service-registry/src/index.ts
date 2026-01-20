import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8600;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'service-registry' });
});

app.get('/', (req, res) => {
  res.json({
    service: '服务注册与发现',
    description: '服务注册、服务发现、健康检查',
  });
});

app.listen(PORT, () => {
  console.log(`服务注册与发现运行在端口 ${PORT}`);
});
