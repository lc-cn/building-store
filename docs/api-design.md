# API 设计规范

## 1. RESTful API 设计原则

### 1.1 基本原则

1. **使用名词而非动词**: 资源用名词表示，操作通过HTTP方法表达
2. **使用复数形式**: `/users` 而不是 `/user`
3. **使用层级关系**: `/users/123/orders` 表示用户的订单
4. **使用HTTP状态码**: 正确使用状态码表达操作结果
5. **版本控制**: API路径包含版本号 `/api/v1/`

### 1.2 HTTP方法使用

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 获取资源 | `GET /api/v1/users` - 获取用户列表 |
| POST | 创建资源 | `POST /api/v1/users` - 创建新用户 |
| PUT | 完整更新资源 | `PUT /api/v1/users/123` - 完整更新用户信息 |
| PATCH | 部分更新资源 | `PATCH /api/v1/users/123` - 部分更新用户信息 |
| DELETE | 删除资源 | `DELETE /api/v1/users/123` - 删除用户 |

### 1.3 HTTP状态码规范

#### 成功响应 (2xx)
- `200 OK` - 请求成功（GET, PUT, PATCH）
- `201 Created` - 资源创建成功（POST）
- `204 No Content` - 请求成功但无返回内容（DELETE）

#### 客户端错误 (4xx)
- `400 Bad Request` - 请求参数错误
- `401 Unauthorized` - 未认证
- `403 Forbidden` - 无权限
- `404 Not Found` - 资源不存在
- `409 Conflict` - 资源冲突
- `422 Unprocessable Entity` - 请求格式正确但语义错误
- `429 Too Many Requests` - 请求过于频繁

#### 服务器错误 (5xx)
- `500 Internal Server Error` - 服务器内部错误
- `502 Bad Gateway` - 网关错误
- `503 Service Unavailable` - 服务不可用
- `504 Gateway Timeout` - 网关超时

## 2. URL设计规范

### 2.1 基本格式

```
https://{host}/api/{version}/{resource}/{id}/{sub-resource}
```

示例:
```
https://api.building-store.com/api/v1/users/123/orders
```

### 2.2 命名规范

1. **小写字母**: 使用小写字母和连字符
   - ✅ `/api/v1/user-profiles`
   - ❌ `/api/v1/UserProfiles`

2. **复数名词**: 集合资源使用复数
   - ✅ `/api/v1/products`
   - ❌ `/api/v1/product`

3. **避免深层嵌套**: 最多3层
   - ✅ `/api/v1/users/123/orders`
   - ❌ `/api/v1/users/123/orders/456/items/789`

### 2.3 查询参数

#### 分页
```
GET /api/v1/products?page=1&limit=20
```

#### 排序
```
GET /api/v1/products?sort=price&order=desc
```

#### 过滤
```
GET /api/v1/products?category=cement&minPrice=100
```

#### 字段选择
```
GET /api/v1/users?fields=id,name,email
```

#### 搜索
```
GET /api/v1/products?q=水泥
```

## 3. 请求与响应格式

### 3.1 请求格式

#### Content-Type
```
Content-Type: application/json
```

#### 请求头
```http
POST /api/v1/users HTTP/1.1
Host: api.building-store.com
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

#### 请求体示例
```json
{
  "name": "张三",
  "email": "zhangsan@example.com",
  "password": "secure_password",
  "phone": "+86-13800138000"
}
```

### 3.2 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "张三",
    "email": "zhangsan@example.com",
    "createdAt": "2026-01-20T08:00:00Z"
  },
  "message": "User created successfully",
  "timestamp": "2026-01-20T08:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 列表响应
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "产品1"
    },
    {
      "id": "2",
      "name": "产品2"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2026-01-20T08:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      },
      {
        "field": "password",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "timestamp": "2026-01-20T08:00:00Z",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

## 4. 错误码规范

### 4.1 错误码格式

```
{DOMAIN}_{ERROR_TYPE}_{SPECIFIC_ERROR}
```

### 4.2 错误码分类

#### 通用错误 (COMMON_*)
- `COMMON_INVALID_REQUEST` - 无效请求
- `COMMON_INTERNAL_ERROR` - 内部错误
- `COMMON_SERVICE_UNAVAILABLE` - 服务不可用
- `COMMON_RATE_LIMIT_EXCEEDED` - 超过速率限制

#### 认证错误 (AUTH_*)
- `AUTH_UNAUTHORIZED` - 未认证
- `AUTH_INVALID_TOKEN` - 无效令牌
- `AUTH_TOKEN_EXPIRED` - 令牌过期
- `AUTH_FORBIDDEN` - 无权限

#### 验证错误 (VALIDATION_*)
- `VALIDATION_ERROR` - 验证失败
- `VALIDATION_FIELD_REQUIRED` - 必填字段缺失
- `VALIDATION_FIELD_INVALID` - 字段格式错误

#### 资源错误 (RESOURCE_*)
- `RESOURCE_NOT_FOUND` - 资源不存在
- `RESOURCE_ALREADY_EXISTS` - 资源已存在
- `RESOURCE_CONFLICT` - 资源冲突

#### 业务错误 (BUSINESS_*)
- `BUSINESS_INSUFFICIENT_STOCK` - 库存不足
- `BUSINESS_PAYMENT_FAILED` - 支付失败
- `BUSINESS_ORDER_CANCELLED` - 订单已取消

## 5. 认证与授权

### 5.1 JWT认证

#### 获取Token
```http
POST /api/v1/auth/token
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "password123"
}
```

响应:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

#### 使用Token
```http
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 刷新Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 5.2 权限控制

使用RBAC（基于角色的访问控制）:

```json
{
  "user": {
    "id": "123",
    "roles": ["customer"],
    "permissions": ["read:products", "create:orders"]
  }
}
```

## 6. API版本控制

### 6.1 URL版本控制（推荐）
```
https://api.building-store.com/api/v1/users
https://api.building-store.com/api/v2/users
```

### 6.2 版本策略

1. **向后兼容**: 尽量保持向后兼容
2. **弃用通知**: 提前通知API弃用
3. **版本并存**: 多版本并存一段时间
4. **文档更新**: 及时更新API文档

## 7. 各服务API定义

### 7.1 用户服务 API

#### 用户注册
```http
POST /api/v1/users/register
Content-Type: application/json

{
  "username": "zhangsan",
  "email": "zhangsan@example.com",
  "password": "SecurePassword123!",
  "phone": "+86-13800138000"
}
```

#### 用户登录
```http
POST /api/v1/users/login
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "SecurePassword123!"
}
```

#### 获取用户信息
```http
GET /api/v1/users/{userId}
Authorization: Bearer <token>
```

#### 更新用户信息
```http
PUT /api/v1/users/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "张三",
  "phone": "+86-13800138000",
  "address": "北京市朝阳区"
}
```

### 7.2 产品服务 API

#### 获取产品列表
```http
GET /api/v1/products?page=1&limit=20&category=cement&sort=price&order=asc
```

#### 获取产品详情
```http
GET /api/v1/products/{productId}
```

#### 搜索产品
```http
GET /api/v1/products/search?q=水泥&category=cement&minPrice=100&maxPrice=500
```

#### 创建产品（管理员）
```http
POST /api/v1/products
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "优质水泥",
  "description": "高强度水泥，适用于各种建筑项目",
  "category": "cement",
  "price": 299.99,
  "unit": "吨",
  "stock": 1000,
  "images": [
    "https://cdn.example.com/product1.jpg"
  ],
  "specifications": {
    "strength": "42.5MPa",
    "standard": "GB175-2007"
  }
}
```

### 7.3 订单服务 API

#### 创建订单
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "p123",
      "quantity": 10,
      "price": 299.99
    }
  ],
  "shippingAddress": {
    "province": "北京市",
    "city": "朝阳区",
    "detail": "建国路88号",
    "contact": "张三",
    "phone": "+86-13800138000"
  },
  "paymentMethod": "alipay"
}
```

#### 获取订单列表
```http
GET /api/v1/orders?status=pending&page=1&limit=20
Authorization: Bearer <token>
```

#### 获取订单详情
```http
GET /api/v1/orders/{orderId}
Authorization: Bearer <token>
```

#### 取消订单
```http
DELETE /api/v1/orders/{orderId}
Authorization: Bearer <token>
```

### 7.4 库存服务 API

#### 查询库存
```http
GET /api/v1/inventory/{productId}
```

响应:
```json
{
  "success": true,
  "data": {
    "productId": "p123",
    "available": 950,
    "reserved": 50,
    "total": 1000
  }
}
```

#### 预留库存（内部API）
```http
POST /api/v1/inventory/reserve
Authorization: Bearer <service-token>
Content-Type: application/json

{
  "orderId": "o456",
  "items": [
    {
      "productId": "p123",
      "quantity": 10
    }
  ]
}
```

### 7.5 支付服务 API

#### 创建支付
```http
POST /api/v1/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "o456",
  "amount": 2999.90,
  "paymentMethod": "alipay",
  "returnUrl": "https://building-store.com/orders/o456"
}
```

响应:
```json
{
  "success": true,
  "data": {
    "paymentId": "pay123",
    "orderId": "o456",
    "amount": 2999.90,
    "status": "pending",
    "paymentUrl": "https://openapi.alipay.com/gateway.do?..."
  }
}
```

#### 查询支付状态
```http
GET /api/v1/payments/{paymentId}
Authorization: Bearer <token>
```

## 8. 限流与配额

### 8.1 限流策略

- **未认证用户**: 100 请求/分钟
- **认证用户**: 1000 请求/分钟
- **VIP用户**: 5000 请求/分钟

### 8.2 限流响应头

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1516389600
```

超过限制时:
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1516389600
Retry-After: 60
```

## 9. 数据格式规范

### 9.1 日期时间格式

使用ISO 8601格式:
```
2026-01-20T08:00:00Z
2026-01-20T16:00:00+08:00
```

### 9.2 货币格式

使用小数表示，精确到分:
```json
{
  "price": 299.99,
  "currency": "CNY"
}
```

### 9.3 布尔值

使用 `true` / `false`，不使用字符串:
```json
{
  "isActive": true,
  "isDeleted": false
}
```

### 9.4 空值处理

- 使用 `null` 表示空值
- 空数组使用 `[]`
- 空对象使用 `{}`

## 10. API文档

### 10.1 文档工具

使用 Swagger/OpenAPI 3.0 规范:

```yaml
openapi: 3.0.0
info:
  title: Building Store API
  version: 1.0.0
  description: Building Store 微服务API文档

servers:
  - url: https://api.building-store.com/api/v1
    description: 生产环境
  - url: https://api-dev.building-store.com/api/v1
    description: 开发环境

paths:
  /users:
    get:
      summary: 获取用户列表
      tags:
        - Users
      parameters:
        - in: query
          name: page
          schema:
            type: integer
            default: 1
      responses:
        '200':
          description: 成功
```

### 10.2 文档访问

- Swagger UI: `https://api.building-store.com/docs`
- ReDoc: `https://api.building-store.com/redoc`
- API Blueprint: `https://api.building-store.com/blueprint`

## 11. 最佳实践

### 11.1 幂等性

确保 PUT、DELETE 操作的幂等性:
```http
PUT /api/v1/users/123
Content-Type: application/json
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

### 11.2 HATEOAS

在响应中包含相关资源的链接:
```json
{
  "id": "123",
  "name": "张三",
  "_links": {
    "self": "/api/v1/users/123",
    "orders": "/api/v1/users/123/orders",
    "addresses": "/api/v1/users/123/addresses"
  }
}
```

### 11.3 批量操作

支持批量操作以提高效率:
```http
POST /api/v1/products/batch
Content-Type: application/json

{
  "operations": [
    {
      "method": "POST",
      "path": "/products",
      "body": { "name": "产品1" }
    },
    {
      "method": "PUT",
      "path": "/products/123",
      "body": { "price": 299.99 }
    }
  ]
}
```

### 11.4 异步操作

对于耗时操作，返回任务ID，客户端轮询状态:
```http
POST /api/v1/orders/export
Authorization: Bearer <token>
```

响应:
```json
{
  "success": true,
  "data": {
    "taskId": "task123",
    "status": "processing",
    "statusUrl": "/api/v1/tasks/task123"
  }
}
```

查询状态:
```http
GET /api/v1/tasks/task123
```

## 12. 总结

本API设计规范确保:
1. ✅ 统一的接口风格
2. ✅ 清晰的错误处理
3. ✅ 完善的认证授权
4. ✅ 良好的可扩展性
5. ✅ 完整的文档支持

所有微服务必须遵循此规范，确保整个系统的一致性和可维护性。
