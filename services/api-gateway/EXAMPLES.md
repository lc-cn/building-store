# API网关配置示例

## 环境变量

在 `.dev.vars` 文件中配置本地开发环境变量：

```ini
JWT_SECRET=your-development-jwt-secret-key
ADMIN_API_KEY=your-development-admin-api-key
```

在 Cloudflare Dashboard 中配置生产环境变量。

## 路由配置示例

### 1. 用户服务路由

```json
{
  "path": "/api/users/*",
  "methods": ["GET", "POST", "PUT", "DELETE"],
  "backends": [
    {
      "id": "user-service-1",
      "url": "https://user-service-1.workers.dev",
      "weight": 1,
      "healthy": true,
      "healthCheckPath": "/health"
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
    "keyPrefix": "users"
  },
  "timeout": 30000,
  "retries": 2,
  "enabled": true
}
```

### 2. 产品服务路由（加权负载均衡）

```json
{
  "path": "/api/products/*",
  "methods": ["*"],
  "backends": [
    {
      "id": "product-service-1",
      "url": "https://product-service-1.workers.dev",
      "weight": 2,
      "healthy": true
    },
    {
      "id": "product-service-2",
      "url": "https://product-service-2.workers.dev",
      "weight": 1,
      "healthy": true
    }
  ],
  "loadBalancer": "weighted",
  "authentication": {
    "type": "none",
    "required": false
  },
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 1000,
    "keyPrefix": "products"
  },
  "timeout": 30000,
  "retries": 2,
  "enabled": true
}
```

### 3. 订单服务路由（带熔断器）

```json
{
  "path": "/api/orders/*",
  "methods": ["GET", "POST", "PUT", "DELETE"],
  "backends": [
    {
      "id": "order-service-1",
      "url": "https://order-service.workers.dev",
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
    "maxRequests": 200,
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

### 4. 路径重写示例

```json
{
  "path": "/api/v1/legacy/*",
  "methods": ["*"],
  "backends": [
    {
      "id": "legacy-service",
      "url": "https://legacy-service.workers.dev",
      "weight": 1,
      "healthy": true
    }
  ],
  "loadBalancer": "round_robin",
  "authentication": {
    "type": "api_key",
    "required": true
  },
  "rewrite": {
    "from": "/api/v1/legacy/",
    "to": "/api/"
  },
  "timeout": 30000,
  "retries": 1,
  "enabled": true
}
```

## 负载均衡策略

### Round Robin（轮询）
均匀分配请求到所有后端服务。

```json
{
  "loadBalancer": "round_robin"
}
```

### Weighted（加权轮询）
根据权重分配请求，权重越高接收的请求越多。

```json
{
  "loadBalancer": "weighted",
  "backends": [
    {
      "id": "backend-1",
      "url": "https://backend-1.example.com",
      "weight": 3
    },
    {
      "id": "backend-2",
      "url": "https://backend-2.example.com",
      "weight": 1
    }
  ]
}
```

### Random（随机）
随机选择一个后端服务。

```json
{
  "loadBalancer": "random"
}
```

### Least Connections（最少连接）
选择当前活跃连接数最少的后端服务。

```json
{
  "loadBalancer": "least_connections"
}
```

## 认证配置

### JWT认证

```json
{
  "authentication": {
    "type": "jwt",
    "required": true,
    "roles": ["user", "admin"]
  }
}
```

请求示例：
```bash
curl https://api-gateway.example.com/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### API Key认证

```json
{
  "authentication": {
    "type": "api_key",
    "required": true
  }
}
```

请求示例：
```bash
curl https://api-gateway.example.com/api/data \
  -H "X-API-Key: your-api-key"
```

### 无认证

```json
{
  "authentication": {
    "type": "none",
    "required": false
  }
}
```

## 限流配置

### 基于时间窗口的限流

```json
{
  "rateLimit": {
    "windowMs": 60000,      // 时间窗口：60秒
    "maxRequests": 100,     // 最大请求数：100
    "keyPrefix": "api"      // 键前缀
  }
}
```

这个配置表示：每个用户/IP在60秒内最多可以发送100个请求。

### 不同路由的限流策略

```json
// 公共API - 限制宽松
{
  "path": "/api/public/*",
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 1000
  }
}

// 敏感API - 限制严格
{
  "path": "/api/admin/*",
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 10
  }
}
```

## 熔断器配置

```json
{
  "circuitBreaker": {
    "failureThreshold": 0.5,    // 失败率阈值：50%
    "successThreshold": 2,      // 成功阈值：2次
    "timeout": 30000,           // 超时时间：30秒
    "halfOpenRequests": 3       // 半开状态允许的请求数：3
  }
}
```

### 熔断器状态机

1. **Closed（关闭）**: 正常状态，所有请求正常转发
2. **Open（打开）**: 失败率超过阈值，拒绝所有请求
3. **Half-Open（半开）**: 超时后尝试恢复，允许少量请求

## KV命名空间

### 创建KV命名空间

```bash
# 开发环境
wrangler kv:namespace create "ROUTES" --preview
wrangler kv:namespace create "RATE_LIMIT" --preview
wrangler kv:namespace create "METRICS" --preview
wrangler kv:namespace create "CIRCUIT_BREAKER" --preview

# 生产环境
wrangler kv:namespace create "ROUTES"
wrangler kv:namespace create "RATE_LIMIT"
wrangler kv:namespace create "METRICS"
wrangler kv:namespace create "CIRCUIT_BREAKER"
```

### 手动添加路由配置到KV

```bash
# 创建路由配置JSON文件
cat > route.json << EOF
{
  "id": "route-1",
  "path": "/api/test/*",
  "methods": ["*"],
  "backends": [
    {
      "id": "backend-1",
      "url": "https://test-backend.workers.dev",
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
  "enabled": true,
  "createdAt": $(date +%s)000,
  "updatedAt": $(date +%s)000
}
EOF

# 上传到KV
wrangler kv:key put --namespace-id=<ROUTES_KV_ID> "route:route-1" "$(cat route.json)"
```

## 监控和告警

### 查看指标

```bash
curl https://api-gateway.example.com/admin/metrics \
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
      "500": 500,
      "502": 500
    }
  }
}
```

## 故障排查

### 查看日志

```bash
# 实时日志
wrangler tail

# 过滤错误日志
wrangler tail | grep ERROR
```

### 测试路由

```bash
# 测试路由是否正常工作
curl -v https://api-gateway.example.com/api/test

# 查看响应头
# X-Request-Id: 请求ID
# X-Proxied-By: API Gateway
# X-Backend-Server: 后端服务ID
```

### 重置熔断器

```bash
curl -X POST https://api-gateway.example.com/admin/circuit-breaker/reset/route-1 \
  -H "X-Admin-Key: your-admin-key"
```

## 性能调优

### 1. 调整超时时间

根据后端服务的响应时间调整：
```json
{
  "timeout": 30000  // 30秒
}
```

### 2. 配置重试次数

```json
{
  "retries": 2  // 失败后重试2次
}
```

### 3. 调整限流阈值

根据流量情况调整：
```json
{
  "rateLimit": {
    "windowMs": 60000,
    "maxRequests": 1000
  }
}
```

### 4. 优化健康检查

```json
{
  "backends": [
    {
      "id": "backend-1",
      "url": "https://backend-1.example.com",
      "healthCheckPath": "/health"  // 自定义健康检查路径
    }
  ]
}
```
