# 认证服务使用示例

本文档提供了认证服务的详细使用示例。

## 快速开始

### 1. 安装和启动

```bash
cd services/auth-service
npm install
npm run dev
```

服务将运行在 `http://localhost:8787`

### 2. 设置测试数据

在使用密码模式之前，需要先在 KV 中创建测试用户：

```javascript
// 使用 wrangler 或通过 API 创建测试用户
// 用户数据存储在 AUTH_KV 中，key: "user:test@example.com"
{
  "userId": "user-123",
  "email": "test@example.com",
  "passwordHash": "salt:hash", // 使用 hashPassword 函数生成
  "roles": ["user", "admin"],
  "active": true
}
```

## 使用场景

### 场景 1: 用户登录（密码模式）

```bash
# 1. 用户登录获取令牌
curl -X POST http://localhost:8787/token \
  -H "Content-Type: application/json" \
  -d '{
    "grantType": "password",
    "username": "test@example.com",
    "password": "Test123456"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "timestamp": 1234567890000
}
```

### 场景 2: 使用访问令牌访问受保护资源

```bash
# 使用访问令牌获取当前用户信息
curl -X GET http://localhost:8787/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 响应示例
{
  "success": true,
  "data": {
    "userId": "user-123",
    "email": "test@example.com",
    "roles": ["user", "admin"],
    "sessionId": "session-456",
    "tokenType": "access",
    "issuedAt": 1234567890,
    "expiresAt": 1234568790
  },
  "timestamp": 1234567890000
}
```

### 场景 3: 令牌刷新

```bash
# 访问令牌过期后，使用刷新令牌获取新的访问令牌
curl -X POST http://localhost:8787/token/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'

# 响应示例
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "timestamp": 1234567890000
}
```

### 场景 4: 用户登出（撤销令牌）

```bash
# 撤销刷新令牌，使其失效
curl -X POST http://localhost:8787/token/revoke \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenTypeHint": "refresh_token"
  }'

# 同时删除会话
curl -X DELETE http://localhost:8787/session/session-456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 场景 5: OAuth 2.0 授权码流程

#### 步骤 1: 创建 OAuth 客户端

```javascript
// 使用管理 API 或直接在 KV 中创建客户端
// 存储在 AUTH_KV 中，key: "oauth:client:client-123"
{
  "clientId": "client-123",
  "clientSecret": "secret-abc",
  "clientName": "My App",
  "redirectUris": ["https://app.example.com/callback"],
  "grantTypes": ["authorization_code", "client_credentials"],
  "scope": ["read", "write"],
  "createdAt": 1234567890000
}
```

#### 步骤 2: 用户授权

```bash
# 用户登录后，应用请求授权
curl -X POST http://localhost:8787/oauth/authorize \
  -H "Content-Type: application/json" \
  -d '{
    "responseType": "code",
    "clientId": "client-123",
    "redirectUri": "https://app.example.com/callback",
    "userId": "user-123",
    "scope": "read write",
    "state": "random-state-xyz"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "code": "auth-code-xyz123",
    "redirectUri": "https://app.example.com/callback?code=auth-code-xyz123&state=random-state-xyz",
    "state": "random-state-xyz"
  },
  "timestamp": 1234567890000
}
```

#### 步骤 3: 交换授权码获取令牌

```bash
# 应用后端使用授权码交换访问令牌
curl -X POST http://localhost:8787/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grantType": "authorization_code",
    "code": "auth-code-xyz123",
    "clientId": "client-123",
    "clientSecret": "secret-abc",
    "redirectUri": "https://app.example.com/callback"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "scope": "read write"
  },
  "timestamp": 1234567890000
}
```

### 场景 6: OAuth 2.0 客户端凭证模式

```bash
# 服务间认证，无需用户参与
curl -X POST http://localhost:8787/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grantType": "client_credentials",
    "clientId": "service-client",
    "clientSecret": "service-secret",
    "scope": "read"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "scope": "read"
  },
  "timestamp": 1234567890000
}
```

### 场景 7: 密码重置流程

#### 步骤 1: 请求重置

```bash
curl -X POST http://localhost:8787/password/reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'

# 响应示例（开发环境会返回令牌）
{
  "success": true,
  "data": {
    "message": "If the email exists, a password reset link has been sent",
    "token": "reset-token-abc123"  // 仅开发环境
  },
  "timestamp": 1234567890000
}
```

#### 步骤 2: 验证重置令牌

```bash
curl -X POST http://localhost:8787/password/reset/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-abc123"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "valid": true,
    "email": "user@example.com"
  },
  "timestamp": 1234567890000
}
```

#### 步骤 3: 确认新密码

```bash
curl -X POST http://localhost:8787/password/reset/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-abc123",
    "newPassword": "NewSecurePass456"
  }'

# 响应示例
{
  "success": true,
  "data": {
    "message": "Password has been reset successfully"
  },
  "timestamp": 1234567890000
}
```

### 场景 8: 会话管理

#### 获取会话信息

```bash
curl -X GET http://localhost:8787/session/session-456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 响应示例
{
  "success": true,
  "data": {
    "sessionId": "session-456",
    "userId": "user-123",
    "email": "user@example.com",
    "createdAt": 1234567890000,
    "expiresAt": 1234654290000,
    "lastAccessedAt": 1234567900000,
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "timestamp": 1234567890000
}
```

#### 删除会话（登出）

```bash
curl -X DELETE http://localhost:8787/session/session-456 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 响应示例
{
  "success": true,
  "data": {
    "deleted": true,
    "message": "Session deleted successfully"
  },
  "timestamp": 1234567890000
}
```

## 错误处理

所有错误响应都遵循统一格式：

```json
{
  "success": false,
  "error": {
    "code": "invalid_credentials",
    "message": "Invalid username or password"
  },
  "timestamp": 1234567890000
}
```

常见错误代码：

- `invalid_request`: 请求参数缺失或格式错误
- `invalid_credentials`: 用户名或密码错误
- `invalid_token`: 令牌无效或格式错误
- `expired_token`: 令牌已过期
- `invalid_client`: 客户端ID或密钥错误
- `invalid_grant`: 授权码或刷新令牌无效
- `unauthorized`: 缺少认证信息
- `forbidden`: 权限不足
- `internal_error`: 服务器内部错误

## 安全建议

1. **HTTPS**: 生产环境必须使用 HTTPS
2. **强密钥**: 使用强随机密钥（至少 32 字节）
3. **令牌存储**: 客户端应安全存储令牌（如 HttpOnly Cookie）
4. **令牌刷新**: 访问令牌过期后使用刷新令牌获取新令牌
5. **CORS**: 配置适当的 CORS 策略
6. **限流**: 实施 API 限流防止滥用
7. **日志**: 记录所有认证相关事件

## 集成示例

### JavaScript/TypeScript 客户端

```typescript
class AuthClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async login(username: string, password: string) {
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grantType: 'password',
        username,
        password
      })
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.accessToken;
      this.refreshToken = data.data.refreshToken;
      return true;
    }
    
    return false;
  }

  async refresh() {
    if (!this.refreshToken) return false;

    const response = await fetch(`${this.baseUrl}/token/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    const data = await response.json();
    
    if (data.success) {
      this.accessToken = data.data.accessToken;
      return true;
    }
    
    return false;
  }

  async getMe() {
    const response = await fetch(`${this.baseUrl}/me`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` }
    });

    return await response.json();
  }
}

// 使用示例
const auth = new AuthClient('http://localhost:8787');
await auth.login('user@example.com', 'password');
const me = await auth.getMe();
console.log(me);
```

## 测试

运行测试脚本：

```bash
# 确保服务正在运行
npm run dev

# 在另一个终端运行测试
node test-api.js
```

## 故障排查

### 问题 1: KV 命名空间未找到

```
Error: KV namespace not found
```

**解决方案**: 创建 KV 命名空间并更新 `wrangler.toml`

### 问题 2: JWT 验证失败

```
{
  "error": {
    "code": "invalid_token",
    "message": "Invalid signature"
  }
}
```

**解决方案**: 检查 `JWT_SECRET` 是否一致

### 问题 3: 用户未找到

```
{
  "error": {
    "code": "invalid_credentials",
    "message": "Invalid username or password"
  }
}
```

**解决方案**: 在 KV 中创建测试用户数据

## 更多资源

- [Hono 文档](https://hono.dev/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [OAuth 2.0 规范](https://oauth.net/2/)
- [JWT 规范](https://jwt.io/)
