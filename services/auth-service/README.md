# 认证服务 (Auth Service)

基于 Cloudflare Workers 的完整认证服务，提供 JWT 令牌管理、OAuth 2.0、单点登录(SSO)和密码重置功能。

## 功能特性

### 1. JWT 令牌管理
- ✅ 访问令牌（Access Token）生成和验证
- ✅ 刷新令牌（Refresh Token）生成和验证
- ✅ 令牌刷新机制
- ✅ 令牌撤销功能
- ✅ 基于 HMAC-SHA256 的令牌签名

### 2. OAuth 2.0 支持
- ✅ 授权码模式（Authorization Code Grant）
- ✅ 客户端凭证模式（Client Credentials Grant）
- ✅ 客户端管理和验证
- ✅ Scope 权限控制
- ✅ 重定向 URI 验证

### 3. 单点登录（SSO）
- ✅ 会话管理和存储
- ✅ 跨域认证支持
- ✅ 会话过期和自动续期
- ✅ 多设备会话管理
- ✅ 会话元数据存储

### 4. 密码重置
- ✅ 密码重置令牌生成
- ✅ 令牌验证和过期检查
- ✅ 一次性使用令牌
- ✅ 安全的密码哈希

## 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono (轻量级 Web 框架)
- **存储**: Cloudflare KV (键值存储)
- **开发语言**: TypeScript
- **加密**: Web Crypto API

## API 端点

### 令牌管理

#### 生成令牌
```http
POST /token
Content-Type: application/json

{
  "grantType": "password",
  "username": "user@example.com",
  "password": "SecurePass123",
  "scope": "read write"
}
```

响应：
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "timestamp": 1234567890
}
```

#### 刷新令牌
```http
POST /token/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### 验证令牌
```http
POST /token/verify
Content-Type: application/json

{
  "token": "eyJhbGc..."
}
```

#### 撤销令牌
```http
POST /token/revoke
Content-Type: application/json

{
  "token": "eyJhbGc...",
  "tokenTypeHint": "refresh_token"
}
```

### OAuth 2.0

#### 授权端点
```http
POST /oauth/authorize
Content-Type: application/json

{
  "responseType": "code",
  "clientId": "client-123",
  "redirectUri": "https://app.example.com/callback",
  "userId": "user-456",
  "scope": "read write",
  "state": "random-state"
}
```

#### 令牌交换
```http
POST /oauth/token
Content-Type: application/json

{
  "grantType": "authorization_code",
  "code": "auth-code-xyz",
  "clientId": "client-123",
  "clientSecret": "secret-abc",
  "redirectUri": "https://app.example.com/callback"
}
```

### 密码重置

#### 请求重置
```http
POST /password/reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 验证重置令牌
```http
POST /password/reset/verify
Content-Type: application/json

{
  "token": "reset-token-xyz"
}
```

#### 确认新密码
```http
POST /password/reset/confirm
Content-Type: application/json

{
  "token": "reset-token-xyz",
  "newPassword": "NewSecurePass456"
}
```

### 会话管理

#### 获取会话信息
```http
GET /session/{sessionId}
Authorization: Bearer {accessToken}
```

#### 删除会话（登出）
```http
DELETE /session/{sessionId}
Authorization: Bearer {accessToken}
```

#### 获取当前用户信息
```http
GET /me
Authorization: Bearer {accessToken}
```

## 环境配置

### 环境变量

在 `wrangler.toml` 或通过 `wrangler secret` 配置：

- `JWT_SECRET`: JWT 签名密钥（生产环境必须设置为强密钥）
- `JWT_ACCESS_EXPIRES_IN`: 访问令牌过期时间（默认: "15m"）
- `JWT_REFRESH_EXPIRES_IN`: 刷新令牌过期时间（默认: "7d"）
- `OAUTH_CLIENT_SECRET`: OAuth 客户端密钥

### KV 命名空间

需要创建以下 KV 命名空间：

1. **AUTH_KV**: 存储用户凭证和 OAuth 客户端信息
2. **TOKEN_KV**: 存储刷新令牌和撤销记录
3. **SESSION_KV**: 存储会话信息

创建 KV 命名空间：
```bash
# 开发环境
wrangler kv:namespace create "AUTH_KV" --preview
wrangler kv:namespace create "TOKEN_KV" --preview
wrangler kv:namespace create "SESSION_KV" --preview

# 生产环境
wrangler kv:namespace create "AUTH_KV"
wrangler kv:namespace create "TOKEN_KV"
wrangler kv:namespace create "SESSION_KV"
```

## 开发与部署

### 安装依赖
```bash
cd services/auth-service
npm install
```

### 本地开发
```bash
npm run dev
```

访问: http://localhost:8787

### 部署到 Cloudflare
```bash
# 部署到开发环境
npm run deploy -- --env development

# 部署到生产环境
npm run deploy -- --env production
```

### 设置生产环境密钥
```bash
# 设置 JWT 密钥
wrangler secret put JWT_SECRET --env production

# 设置 OAuth 客户端密钥
wrangler secret put OAUTH_CLIENT_SECRET --env production
```

### 查看实时日志
```bash
npm run tail
```

## 安全最佳实践

1. **密钥管理**
   - 生产环境必须使用强随机密钥
   - 通过 `wrangler secret` 管理敏感信息
   - 定期轮换密钥

2. **令牌安全**
   - 访问令牌使用短过期时间（15分钟）
   - 刷新令牌使用长过期时间（7天）
   - 敏感操作需要重新认证

3. **OAuth 安全**
   - 验证重定向 URI
   - 使用 state 参数防止 CSRF
   - 授权码一次性使用

4. **密码安全**
   - 使用强密码策略
   - 密码哈希使用 Salt
   - 重置令牌一次性使用

## 项目结构

```
src/
├── index.ts              # 主入口和路由配置
├── types.ts              # TypeScript 类型定义
├── handlers/             # 请求处理器
│   ├── token.ts          # 令牌处理器
│   ├── oauth.ts          # OAuth 处理器
│   └── password.ts       # 密码重置处理器
├── services/             # 业务逻辑层
│   ├── jwt.ts            # JWT 生成和验证
│   ├── session.ts        # 会话管理
│   └── oauth.ts          # OAuth 逻辑
├── middleware/           # 中间件
│   └── auth.ts           # 认证中间件
└── utils/                # 工具函数
    ├── crypto.ts         # 加密工具
    └── validation.ts     # 验证工具
```

## 测试示例

### 测试令牌生成
```bash
curl -X POST http://localhost:8787/token \
  -H "Content-Type: application/json" \
  -d '{
    "grantType": "password",
    "username": "test@example.com",
    "password": "Test123456"
  }'
```

### 测试令牌验证
```bash
curl -X POST http://localhost:8787/token/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_ACCESS_TOKEN"
  }'
```

### 测试 OAuth 授权
```bash
curl -X POST http://localhost:8787/oauth/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "responseType": "code",
    "clientId": "test-client",
    "redirectUri": "http://localhost:3000/callback",
    "userId": "user-123"
  }'
```

## 性能特点

- ✅ **全球边缘部署**: 在全球 200+ 个数据中心运行
- ✅ **零冷启动**: Cloudflare Workers 无冷启动延迟
- ✅ **自动扩展**: 自动处理流量高峰
- ✅ **低延迟**: 平均响应时间 < 50ms
- ✅ **按请求计费**: 只为实际使用付费

## 监控和日志

### 查看日志
```bash
npm run tail
```

### 日志格式
所有请求都会记录以下信息：
- HTTP 方法
- 请求路径
- 响应状态码
- 响应时间

## 故障排查

### 常见问题

1. **KV 命名空间未绑定**
   - 确保在 `wrangler.toml` 中配置了 KV 绑定
   - 检查 KV 命名空间 ID 是否正确

2. **JWT 验证失败**
   - 检查 `JWT_SECRET` 是否一致
   - 确认令牌未过期

3. **CORS 错误**
   - 服务已启用 CORS，检查客户端配置

## 贡献

详见主仓库的 [贡献指南](../../docs/CONTRIBUTING.md)

## 许可证

MIT License
