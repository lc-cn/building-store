#!/bin/bash

# 初始化所有后端服务

SERVICES_DIR="services"

# 服务配置
declare -A SERVICES
SERVICES[product-service]="8002:产品服务:产品目录管理、分类管理、产品搜索、价格管理"
SERVICES[order-service]="8003:订单服务:订单创建、订单状态管理、订单查询、订单历史"
SERVICES[inventory-service]="8004:库存服务:库存管理、库存预留、库存释放、库存同步"
SERVICES[payment-service]="8005:支付服务:支付处理、退款处理、支付回调、账单管理"
SERVICES[auth-service]="8006:认证服务:JWT令牌生成、令牌验证、OAuth2.0、单点登录"
SERVICES[notification-service]="8007:通知服务:邮件通知、短信通知、站内消息、推送通知"

# 为每个服务创建基础结构
for service in "${!SERVICES[@]}"; do
    IFS=: read -r port name description <<< "${SERVICES[$service]}"
    
    SERVICE_DIR="$SERVICES_DIR/$service"
    
    # 创建 package.json
    cat > "$SERVICE_DIR/package.json" << PKGJSON
{
  "name": "$service",
  "version": "0.1.0",
  "description": "Building Store $name",
  "main": "dist/index.js",
  "scripts": {
    "start": "node dist/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.20",
    "@types/node": "^20.9.0",
    "@types/cors": "^2.8.16",
    "@types/morgan": "^1.9.9",
    "typescript": "^5.2.2",
    "ts-node-dev": "^2.0.0",
    "@typescript-eslint/eslint-plugin": "^6.10.0",
    "@typescript-eslint/parser": "^6.10.0",
    "eslint": "^8.53.0",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8"
  },
  "engines": {
    "node": ">=18"
  }
}
PKGJSON

    # 创建 .gitignore
    cat > "$SERVICE_DIR/.gitignore" << GITIGNORE
node_modules/
dist/
.env
.env.local
npm-debug.log
yarn-error.log
*.log
.DS_Store
GITIGNORE

    # 创建 tsconfig.json
    cat > "$SERVICE_DIR/tsconfig.json" << TSCONFIG
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
TSCONFIG

    # 创建 .env.example
    cat > "$SERVICE_DIR/.env.example" << ENVEXAMPLE
NODE_ENV=development
PORT=$port
CONSUL_HOST=localhost
CONSUL_PORT=8500
ENVEXAMPLE

    # 创建目录结构
    mkdir -p "$SERVICE_DIR/src"/{controllers,services,routes,middleware,utils,types}
    
    # 创建 index.ts
    cat > "$SERVICE_DIR/src/index.ts" << INDEXTS
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || $port;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: '$service' });
});

// 路由
app.get('/', (req, res) => {
  res.json({
    service: '$name',
    version: '0.1.0',
    description: '$description',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(\`$name 运行在端口 \${PORT}\`);
});

export default app;
INDEXTS

done

echo "所有服务初始化完成！"
