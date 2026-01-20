# API Gateway - 建材商城API网关

## 服务说明

基于 Cloudflare Workers 的高性能API网关，提供服务路由、负载均衡、限流、熔断、认证等功能。

## 核心功能

### 1. 服务路由与转发
- ✅ 动态路由配置（存储在KV中）
- ✅ 路径匹配（支持通配符）
- ✅ 请求转发到后端服务
- ✅ 路径重写和参数转换

### 2. 负载均衡
- ✅ 轮询（Round Robin）
- ✅ 加权轮询（Weighted Round Robin）
- ✅ 随机（Random）
- ✅ 最少连接（Least Connections）

### 3. 限流
- ✅ 基于IP的限流
- ✅ 基于用户的限流
- ✅ 滑动窗口算法
- ✅ 可配置限流规则

### 4. 熔断器
- ✅ 熔断器状态机（Closed/Open/Half-Open）
- ✅ 自动故障检测
- ✅ 服务降级
- ✅ 自动恢复

### 5. 统一认证
- ✅ JWT令牌验证
- ✅ API密钥验证
- ✅ 角色权限检查
- ✅ 可配置认证策略

### 6. 健康检查
- ✅ 定期健康检查
- ✅ 自动剔除不健康的后端
- ✅ 服务恢复检测

### 7. 监控和统计
- ✅ 请求统计
- ✅ 延迟监控
- ✅ 错误率统计
- ✅ 实时指标

## 技术栈

- **运行时**: Cloudflare Workers Runtime
- **框架**: Hono 3.x (轻量级Web框架)
- **存储**: Cloudflare KV (键值存储)
- **开发语言**: TypeScript
- **部署**: Cloudflare Workers

## 架构

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         API Gateway                  │
│  ┌──────────────────────────────┐   │
│  │  Middleware Layer             │   │
│  │  - Logger                     │   │
│  │  - Error Handler              │   │
│  │  - Auth (JWT/API Key)         │   │
│  │  - Rate Limit                 │   │
│  │  - Circuit Breaker            │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Router Service               │   │
│  │  - Route Matching             │   │
│  │  - Path Rewriting             │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Load Balancer                │   │
│  │  - Backend Selection          │   │
│  │  - Health Check               │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Proxy Handler                │   │
│  │  - Request Forwarding         │   │
│  │  - Response Processing        │   │
│  └──────────────────────────────┘   │
└─────────────┬────────────────────────┘
              │
       ┌──────┴──────┐
       ▼             ▼
┌──────────┐   ┌──────────┐
│ Backend  │   │ Backend  │
│ Service 1│   │ Service 2│
└──────────┘   └──────────┘
```

## API端点

### 管理接口（需要管理员权限）

#### 路由管理
```bash
# 获取所有路由
GET /admin/routes
Header: X-Admin-Key: your-admin-key

# 获取单个路由
GET /admin/routes/:id
Header: X-Admin-Key: your-admin-key

# 创建路由
POST /admin/routes
Header: X-Admin-Key: your-admin-key
Content-Type: application/json

{
  "path": "/api/users/*",
  "methods": ["GET", "POST"],
  "backends": [
    {
      "id": "user-service-1",
      "url": "https://user-service.example.com",
      "weight": 1,
      "healthy": true
    }
  ],
  "loadBalancer": "round_robin",
  "authentication": {
    "type": "jwt",
    "required": true,
    "roles": ["user", "admin"]
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 100,
    "keyPrefix": "ratelimit"
  },
  "circuitBreaker": {
    "failureThreshold": 0.5,
    "successThreshold": 2,
    "timeout": 30000,
    "halfOpenRequests": 3
  },
  "timeout": 30000,
  "retries": 2,
  "enabled": true
}

# 更新路由
PUT /admin/routes/:id
Header: X-Admin-Key: your-admin-key
Content-Type: application/json

# 删除路由
DELETE /admin/routes/:id
Header: X-Admin-Key: your-admin-key
```

#### 监控和统计
```bash
# 获取指标数据
GET /admin/metrics
Header: X-Admin-Key: your-admin-key

# 健康检查
GET /admin/health
Header: X-Admin-Key: your-admin-key

# 获取负载均衡统计
GET /admin/load-balancer/stats
Header: X-Admin-Key: your-admin-key

# 获取熔断器状态
GET /admin/circuit-breaker/stats/:service
Header: X-Admin-Key: your-admin-key

# 重置熔断器
POST /admin/circuit-breaker/reset/:service
Header: X-Admin-Key: your-admin-key
```

### 代理接口

```bash
# 所有API请求都会被代理转发
ANY /api/*
Header: Authorization: Bearer <jwt-token>  # 如果需要认证
```

## 开发与部署

### 前置要求

- Node.js 18+
- npm 或 yarn
- Cloudflare账号
- Wrangler CLI

### 安装依赖

```bash
cd services/api-gateway
npm install
```

### 本地开发

```bash
npm run dev
```

访问: http://localhost:8787

### 部署到 Cloudflare

1. 配置KV命名空间：

```bash
# 创建KV命名空间
wrangler kv:namespace create "ROUTES"
wrangler kv:namespace create "RATE_LIMIT"
wrangler kv:namespace create "METRICS"
wrangler kv:namespace create "CIRCUIT_BREAKER"

# 更新wrangler.toml中的KV命名空间ID
```

2. 配置环境变量：

在Cloudflare Dashboard中设置：
- `JWT_SECRET`: JWT密钥
- `ADMIN_API_KEY`: 管理API密钥

3. 部署：

```bash
npm run deploy
```

### 查看实时日志

```bash
npm run tail
```

## 配置文件

- `wrangler.toml`: Cloudflare Workers配置
- `tsconfig.json`: TypeScript配置
- `package.json`: 项目依赖

## 使用示例

### 1. 创建路由规则

```bash
curl -X POST https://api-gateway.your-domain.com/admin/routes \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/api/products/*",
    "methods": ["GET", "POST", "PUT", "DELETE"],
    "backends": [
      {
        "id": "product-service-1",
        "url": "https://product-service-1.example.com",
        "weight": 2,
        "healthy": true
      },
      {
        "id": "product-service-2",
        "url": "https://product-service-2.example.com",
        "weight": 1,
        "healthy": true
      }
    ],
    "loadBalancer": "weighted",
    "authentication": {
      "type": "jwt",
      "required": true
    },
    "rateLimit": {
      "windowMs": 60000,
      "maxRequests": 1000,
      "keyPrefix": "product"
    },
    "timeout": 30000,
    "retries": 2,
    "enabled": true
  }'
```

### 2. 发送API请求

```bash
# 获取JWT令牌（从认证服务）
TOKEN="your-jwt-token"

# 通过网关访问产品服务
curl https://api-gateway.your-domain.com/api/products \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 查看监控指标

```bash
curl https://api-gateway.your-domain.com/admin/metrics \
  -H "X-Admin-Key: your-admin-key"
```

## 性能优化

- ✅ 使用KV缓存路由配置
- ✅ 请求级别的内存缓存
- ✅ 连接复用
- ✅ 最小化序列化/反序列化
- ✅ 边缘计算（全球部署）

## 安全特性

- ✅ JWT令牌验证
- ✅ API密钥认证
- ✅ 限流保护
- ✅ CORS支持
- ✅ 请求ID追踪
- ✅ 错误信息脱敏

## 监控和日志

- ✅ 请求日志（包含请求ID、延迟、状态码）
- ✅ 错误日志
- ✅ 性能指标
- ✅ 实时统计

## 故障处理

- ✅ 自动重试
- ✅ 熔断器保护
- ✅ 服务降级
- ✅ 健康检查
- ✅ 超时控制

## 文档

- [API文档](./docs/API.md)
- [配置指南](./docs/CONFIGURATION.md)
- [开发指南](../../docs/development.md)

## License

MIT
