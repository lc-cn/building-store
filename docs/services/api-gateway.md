# API 网关 (API Gateway)

## 概述

API网关作为系统的统一入口，负责请求路由、负载均衡、认证授权、限流熔断等功能。

## 仓库地址

```
https://github.com/lc-cn/building-store-api-gateway
```

## 技术选型

推荐使用以下技术之一：

### 选项1: Kong Gateway
- 开源、高性能
- 丰富的插件生态
- 易于扩展

### 选项2: Spring Cloud Gateway
- Java生态
- 与Spring Boot集成良好
- 功能完整

### 选项3: Nginx + Lua
- 极致性能
- 灵活配置
- 稳定可靠

## 主要功能

### 1. 路由管理
- 动态路由配置
- 路径重写
- 请求转发
- 负载均衡

### 2. 认证授权
- JWT验证
- OAuth 2.0
- API密钥认证
- RBAC权限控制

### 3. 限流熔断
- 全局限流
- 用户级限流
- API级限流
- 熔断器模式

### 4. 协议转换
- HTTP/HTTPS
- WebSocket
- gRPC Gateway

### 5. 可观测性
- 请求日志
- 性能监控
- 链路追踪
- 错误统计

## 路由配置示例

### Kong配置

```yaml
services:
  - name: user-service
    url: http://user-service:8001
    routes:
      - name: user-routes
        paths:
          - /api/v1/users
        methods:
          - GET
          - POST
          - PUT
          - DELETE
        plugins:
          - name: jwt
          - name: rate-limiting
            config:
              minute: 100
          - name: cors

  - name: product-service
    url: http://product-service:8002
    routes:
      - name: product-routes
        paths:
          - /api/v1/products
        plugins:
          - name: jwt
          - name: rate-limiting
            config:
              minute: 200

  - name: order-service
    url: http://order-service:8003
    routes:
      - name: order-routes
        paths:
          - /api/v1/orders
        plugins:
          - name: jwt
          - name: rate-limiting
            config:
              minute: 50
```

### Nginx配置

```nginx
upstream user_service {
    server user-service:8001;
}

upstream product_service {
    server product-service:8002;
}

upstream order_service {
    server order-service:8003;
}

server {
    listen 8000;
    server_name api.building-store.com;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    
    # User Service
    location /api/v1/users {
        limit_req zone=api_limit burst=20;
        proxy_pass http://user_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Product Service
    location /api/v1/products {
        limit_req zone=api_limit burst=50;
        proxy_pass http://product_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Order Service
    location /api/v1/orders {
        limit_req zone=api_limit burst=30;
        proxy_pass http://order_service;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 中间件/插件配置

### JWT验证插件

```javascript
// Kong Lua插件示例
local jwt = require "resty.jwt"
local jwt_secret = os.getenv("JWT_SECRET")

function verify_jwt(token)
  local jwt_obj = jwt:verify(jwt_secret, token)
  if not jwt_obj.verified then
    return false, "Invalid token"
  end
  return true, jwt_obj.payload
end
```

### 限流插件

```javascript
// 基于Redis的限流
const redis = require('redis');
const client = redis.createClient();

async function rateLimit(userId, limit, window) {
  const key = `rate_limit:${userId}`;
  const count = await client.incr(key);
  
  if (count === 1) {
    await client.expire(key, window);
  }
  
  if (count > limit) {
    throw new Error('Rate limit exceeded');
  }
  
  return count;
}
```

## 监控指标

- 请求总数
- 请求成功率
- 平均响应时间
- P95/P99响应时间
- 限流触发次数
- 熔断触发次数
- 各服务流量分布

## 部署配置

### Docker Compose

```yaml
version: '3.8'
services:
  api-gateway:
    image: building-store/api-gateway:latest
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET=${JWT_SECRET}
      - CONSUL_URL=http://consul:8500
      - REDIS_URL=redis://redis:6379
    depends_on:
      - consul
      - redis
    networks:
      - building-store-network
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: building-store/api-gateway:latest
        ports:
        - containerPort: 8000
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secret
              key: jwt-secret
```

## 环境变量

```bash
# 服务配置
PORT=8000
NODE_ENV=production

# JWT配置
JWT_SECRET=your-secret-key

# 服务发现
CONSUL_HOST=localhost
CONSUL_PORT=8500

# Redis配置（限流）
REDIS_URL=redis://localhost:6379

# 日志配置
LOG_LEVEL=info

# 限流配置
RATE_LIMIT_GLOBAL=1000
RATE_LIMIT_PER_USER=100
RATE_LIMIT_WINDOW=60
```

## 健康检查

```http
GET /health

Response:
{
  "status": "healthy",
  "uptime": 12345,
  "services": {
    "user-service": "healthy",
    "product-service": "healthy",
    "order-service": "healthy"
  }
}
```

## 安全配置

1. HTTPS强制
2. CORS配置
3. 请求体大小限制
4. 超时配置
5. IP白名单/黑名单
6. DDoS防护

## 性能优化

1. 连接池管理
2. 缓存策略
3. 压缩响应
4. HTTP/2支持
5. 负载均衡算法优化

## 故障处理

### 熔断器配置

```javascript
const circuitBreaker = {
  threshold: 5,           // 失败阈值
  timeout: 60000,         // 超时时间
  resetTimeout: 30000     // 重置时间
};
```

### 降级策略

```javascript
// 服务降级返回默认数据
if (serviceUnavailable) {
  return {
    success: true,
    data: cachedData,
    fromCache: true
  };
}
```

## 日志格式

```json
{
  "timestamp": "2026-01-20T08:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/v1/users/123",
  "status": 200,
  "duration": 45,
  "service": "user-service",
  "userId": "user_123",
  "ip": "192.168.1.100"
}
```

## 开发和测试

```bash
# 本地开发
npm run dev

# 运行测试
npm run test

# 压力测试
npm run test:load
```
