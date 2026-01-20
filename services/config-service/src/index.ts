import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8500;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'config-service' });
});

app.get('/', (req, res) => {
  res.json({
    service: '配置中心',
    description: '集中配置管理、动态配置更新',
  });
});

app.listen(PORT, () => {
  console.log(`配置中心运行在端口 ${PORT}`);
});
