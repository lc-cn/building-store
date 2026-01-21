#!/bin/bash

# 将所有微服务转换为 Cloudflare Workers

SERVICES_DIR="services"

# 服务配置
declare -A SERVICES
SERVICES[product-service]="8002:产品服务:产品目录管理、分类管理、产品搜索、价格管理"
SERVICES[order-service]="8003:订单服务:订单创建、订单状态管理、订单查询、订单历史"
SERVICES[inventory-service]="8004:库存服务:库存管理、库存预留、库存释放、库存同步"
SERVICES[payment-service]="8005:支付服务:支付处理、退款处理、支付回调、账单管理"
SERVICES[auth-service]="8006:认证服务:JWT令牌生成、令牌验证、OAuth2.0、单点登录"
SERVICES[notification-service]="8007:通知服务:邮件通知、短信通知、站内消息、推送通知"
SERVICES[api-gateway]="8000:API网关:路由转发、负载均衡、限流熔断、统一认证"

# 为每个服务创建 Cloudflare Workers 结构
for service in "${!SERVICES[@]}"; do
    IFS=: read -r port name description <<< "${SERVICES[$service]}"
    
    SERVICE_DIR="$SERVICES_DIR/$service"
    
    # 创建 package.json
    cat > "$SERVICE_DIR/package.json" << PKGJSON
{
  "name": "$service",
  "version": "0.1.0",
  "description": "Building Store $name - Cloudflare Workers",
  "main": "src/index.ts",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail",
    "test": "vitest"
  },
  "dependencies": {
    "hono": "^3.11.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20231218.0",
    "wrangler": "^3.20.0",
    "typescript": "^5.2.2",
    "vitest": "^1.0.0"
  }
}
PKGJSON

    # 创建 wrangler.toml
    cat > "$SERVICE_DIR/wrangler.toml" << WRANGLER
name = "$service"
main = "src/index.ts"
compatibility_date = "2023-12-01"

[env.production]
name = "$service-prod"

[env.development]
name = "$service-dev"
WRANGLER

    # 创建 tsconfig.json
    cat > "$SERVICE_DIR/tsconfig.json" << TSCONFIG
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "moduleResolution": "bundler",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
TSCONFIG

    # 删除旧的 .env.example，创建 .dev.vars
    rm -f "$SERVICE_DIR/.env.example"
    cat > "$SERVICE_DIR/.dev.vars" << DEVVARS
# 开发环境变量
# Cloudflare Workers 使用 .dev.vars 替代 .env
DEVVARS

    # 更新 .gitignore
    cat > "$SERVICE_DIR/.gitignore" << GITIGNORE
node_modules/
dist/
.wrangler/
.dev.vars
wrangler.toml.bak
*.log
.DS_Store
GITIGNORE

    # 创建 Hono-based src/index.ts
    cat > "$SERVICE_DIR/src/index.ts" << INDEXTS
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

// 中间件
app.use('/*', cors());

// 健康检查
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    service: '$service',
    runtime: 'cloudflare-workers'
  });
});

// 根路由
app.get('/', (c) => {
  return c.json({
    service: '$name',
    version: '0.1.0',
    description: '$description',
    runtime: 'Cloudflare Workers'
  });
});

export default app;
INDEXTS

done

echo "所有服务已转换为 Cloudflare Workers 格式！"
