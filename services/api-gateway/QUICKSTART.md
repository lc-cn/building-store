# API网关快速开始指南

## 概述

本API网关服务已完全实现，提供了完整的服务路由、负载均衡、限流、熔断、认证等功能。

## 已实现的功能

### ✅ 核心功能
- [x] 服务路由与转发（支持通配符和路径重写）
- [x] 4种负载均衡策略（轮询、加权、随机、最少连接）
- [x] 基于IP的限流（滑动窗口算法）
- [x] 熔断器（Closed/Open/Half-Open状态机）
- [x] JWT和API Key认证
- [x] 健康检查和自动剔除
- [x] 请求日志和指标统计
- [x] 完整的管理API

### 📁 文件结构

```
services/api-gateway/
├── src/
│   ├── index.ts                      # 主入口
│   ├── types.ts                      # 类型定义
│   ├── handlers/                     
│   │   ├── proxy.ts                  # 代理转发处理器
│   │   └── admin.ts                  # 管理接口处理器
│   ├── middleware/                   
│   │   ├── auth.ts                   # 认证中间件
│   │   ├── ratelimit.ts              # 限流中间件
│   │   ├── circuitBreaker.ts         # 熔断器中间件
│   │   └── logger.ts                 # 日志中间件
│   ├── services/                     
│   │   ├── router.ts                 # 路由服务
│   │   ├── loadBalancer.ts           # 负载均衡服务
│   │   └── healthCheck.ts            # 健康检查服务
│   └── utils/                        
│       ├── metrics.ts                # 指标统计工具
│       └── cache.ts                  # 缓存工具
├── wrangler.toml                     # Cloudflare Workers配置
├── package.json                      
├── README.md                         # 完整文档
├── EXAMPLES.md                       # 配置示例
└── .dev.vars.example                 # 环境变量示例
```

## 快速开始

### 1. 安装依赖

```bash
cd services/api-gateway
npm install
```

### 2. 配置环境变量

创建 `.dev.vars` 文件：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars` 并设置密钥：

```ini
JWT_SECRET=your-development-jwt-secret
ADMIN_API_KEY=your-development-admin-api-key
```

### 3. 本地开发

```bash
npm run dev
```

访问 http://localhost:8787

### 4. 创建路由规则

```bash
curl -X POST http://localhost:8787/admin/routes \
  -H "X-Admin-Key: your-development-admin-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/api/test/*",
    "methods": ["*"],
    "backends": [
      {
        "id": "test-backend",
        "url": "https://jsonplaceholder.typicode.com",
        "weight": 1,
        "healthy": true
      }
    ],
    "loadBalancer": "round_robin",
    "authentication": {
      "type": "none",
      "required": false
    },
    "timeout": 30000,
    "retries": 2,
    "enabled": true
  }'
```

### 5. 测试代理转发

```bash
# 通过网关访问后端服务
curl http://localhost:8787/api/test/posts/1
```

### 6. 查看监控指标

```bash
curl http://localhost:8787/admin/metrics \
  -H "X-Admin-Key: your-development-admin-api-key"
```

## 生产部署

### 1. 创建KV命名空间

```bash
# 创建KV命名空间
wrangler kv:namespace create "ROUTES"
wrangler kv:namespace create "RATE_LIMIT"
wrangler kv:namespace create "METRICS"
wrangler kv:namespace create "CIRCUIT_BREAKER"
```

### 2. 更新wrangler.toml

将KV命名空间ID更新到 `wrangler.toml` 中。

### 3. 设置环境变量

在Cloudflare Dashboard中设置：
- `JWT_SECRET`: 生产环境JWT密钥
- `ADMIN_API_KEY`: 生产环境管理API密钥

### 4. 部署

```bash
npm run deploy
```

## API端点

### 管理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /admin/routes | 获取所有路由 |
| GET | /admin/routes/:id | 获取单个路由 |
| POST | /admin/routes | 创建路由 |
| PUT | /admin/routes/:id | 更新路由 |
| DELETE | /admin/routes/:id | 删除路由 |
| GET | /admin/metrics | 获取统计指标 |
| GET | /admin/health | 健康检查 |
| GET | /admin/load-balancer/stats | 负载均衡统计 |
| POST | /admin/circuit-breaker/reset/:service | 重置熔断器 |
| GET | /admin/circuit-breaker/stats/:service | 获取熔断器状态 |

### 代理接口

| 方法 | 路径 | 描述 |
|------|------|------|
| ANY | /api/* | 代理转发到后端服务 |

## 配置示例

### 基础路由

```json
{
  "path": "/api/users/*",
  "methods": ["GET", "POST"],
  "backends": [
    {
      "id": "user-service",
      "url": "https://user-service.example.com",
      "weight": 1,
      "healthy": true
    }
  ],
  "loadBalancer": "round_robin",
  "authentication": {
    "type": "none",
    "required": false
  },
  "timeout": 30000,
  "retries": 2,
  "enabled": true
}
```

### 带认证的路由

```json
{
  "path": "/api/admin/*",
  "methods": ["*"],
  "backends": [
    {
      "id": "admin-service",
      "url": "https://admin-service.example.com",
      "weight": 1,
      "healthy": true
    }
  ],
  "loadBalancer": "round_robin",
  "authentication": {
    "type": "jwt",
    "required": true,
    "roles": ["admin"]
  },
  "timeout": 30000,
  "retries": 2,
  "enabled": true
}
```

### 带限流和熔断的路由

```json
{
  "path": "/api/orders/*",
  "methods": ["*"],
  "backends": [
    {
      "id": "order-service",
      "url": "https://order-service.example.com",
      "weight": 1,
      "healthy": true
    }
  ],
  "loadBalancer": "round_robin",
  "authentication": {
    "type": "jwt",
    "required": true
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 100,
    "keyPrefix": "orders"
  },
  "circuitBreaker": {
    "failureThreshold": 0.5,
    "successThreshold": 2,
    "timeout": 30000,
    "halfOpenRequests": 3
  },
  "timeout": 30000,
  "retries": 3,
  "enabled": true
}
```

## 负载均衡策略

### 1. 轮询 (round_robin)
均匀分配请求到所有后端。

### 2. 加权轮询 (weighted)
根据权重分配请求。

```json
{
  "loadBalancer": "weighted",
  "backends": [
    { "id": "backend-1", "url": "...", "weight": 3 },
    { "id": "backend-2", "url": "...", "weight": 1 }
  ]
}
```

### 3. 随机 (random)
随机选择后端。

### 4. 最少连接 (least_connections)
选择当前连接数最少的后端。

## 监控和统计

### 查看指标

```bash
curl http://localhost:8787/admin/metrics \
  -H "X-Admin-Key: your-admin-key"
```

响应示例：

```json
{
  "success": true,
  "data": {
    "totalRequests": 10000,
    "successfulRequests": 9500,
    "failedRequests": 500,
    "averageLatency": 250,
    "errorRate": 0.05,
    "requestsByRoute": {
      "route-1": 5000,
      "route-2": 3000,
      "route-3": 2000
    },
    "requestsByStatus": {
      "200": 8000,
      "404": 1000,
      "500": 1000
    }
  }
}
```

## 故障排查

### 查看实时日志

```bash
wrangler tail
```

### 测试路由匹配

```bash
# 获取所有路由
curl http://localhost:8787/admin/routes \
  -H "X-Admin-Key: your-admin-key"
```

### 检查熔断器状态

```bash
curl http://localhost:8787/admin/circuit-breaker/stats/route-id \
  -H "X-Admin-Key: your-admin-key"
```

### 重置熔断器

```bash
curl -X POST http://localhost:8787/admin/circuit-breaker/reset/route-id \
  -H "X-Admin-Key: your-admin-key"
```

## 安全建议

1. **生产环境**：
   - 使用强随机密钥作为 JWT_SECRET 和 ADMIN_API_KEY
   - 定期轮换密钥
   - 使用HTTPS

2. **限流配置**：
   - 根据实际流量调整限流阈值
   - 为不同的路由设置不同的限流规则

3. **熔断器配置**：
   - 根据服务特性调整失败阈值
   - 设置合理的超时时间

## 性能优化

1. **使用KV缓存**：路由配置自动缓存在KV中
2. **健康检查**：定期检查后端健康状态
3. **连接复用**：自动管理后端连接
4. **边缘计算**：利用Cloudflare全球网络

## 下一步

1. 查看 [README.md](./README.md) 了解完整功能
2. 查看 [EXAMPLES.md](./EXAMPLES.md) 了解更多配置示例
3. 配置路由规则
4. 部署到生产环境

## 技术支持

如有问题，请查看：
- 项目文档：`/docs`
- README：`services/api-gateway/README.md`
- 配置示例：`services/api-gateway/EXAMPLES.md`
