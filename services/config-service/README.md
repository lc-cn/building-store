# 配置中心服务 (Config Service)

基于 Cloudflare Workers 和 Hono 框架构建的分布式配置中心服务，提供配置管理、版本控制、动态更新等完整功能。

## 🌟 核心功能

### 1. 配置管理
- ✅ 配置的增删改查（CRUD）
- ✅ 配置的层级化存储（环境/服务/键）
- ✅ 配置值的类型安全验证
- ✅ 配置描述和元数据管理

### 2. 版本控制
- ✅ 自动版本记录
- ✅ 版本历史查询
- ✅ 版本详情查看
- ✅ 版本回滚功能
- ✅ 版本间差异比较

### 3. 环境管理
- ✅ 多环境支持（dev/test/prod）
- ✅ 环境隔离
- ✅ 环境配置管理
- ✅ 按环境查询服务列表

### 4. 安全控制
- ✅ 敏感配置自动加密（AES-GCM）
- ✅ API Key 认证
- ✅ 操作审计日志
- ✅ IP 地址记录

### 5. 动态配置
- ✅ 配置热更新
- ✅ Server-Sent Events (SSE) 实时订阅
- ✅ 配置变更通知

## 📦 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono v3
- **存储**: Cloudflare KV
- **加密**: Web Crypto API (AES-GCM)
- **语言**: TypeScript

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 部署到 Cloudflare

```bash
npm run deploy
```

## 📖 API 文档

### 基础信息

- **基础 URL**: `https://config-service.your-domain.workers.dev`
- **认证方式**: Bearer Token (Header: `Authorization: Bearer <token>`)

### 配置管理 API

#### 1. 获取单个配置

```http
GET /config/:env/:service/:key
```

**参数:**
- `env`: 环境名称 (dev/test/prod)
- `service`: 服务名称
- `key`: 配置键名

**响应示例:**
```json
{
  "key": "database.host",
  "value": "localhost",
  "encrypted": false,
  "description": "数据库主机地址",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "createdBy": "admin"
}
```

#### 2. 获取服务的所有配置

```http
GET /config/:env/:service
```

**响应示例:**
```json
{
  "environment": "dev",
  "service": "user-service",
  "configs": {
    "database.host": { ... },
    "database.port": { ... }
  },
  "count": 2
}
```

#### 3. 创建配置

```http
POST /config/:env/:service
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "database.password",
  "value": "secret123",
  "description": "数据库密码",
  "encrypt": true
}
```

**响应:**
```json
{
  "message": "配置创建成功",
  "config": { ... },
  "version": 1
}
```

#### 4. 更新配置

```http
PUT /config/:env/:service/:key
Authorization: Bearer <token>
Content-Type: application/json

{
  "value": "new-value",
  "description": "更新后的描述"
}
```

#### 5. 删除配置

```http
DELETE /config/:env/:service/:key
Authorization: Bearer <token>
```

### 环境管理 API

#### 1. 获取所有环境

```http
GET /environments
```

#### 2. 获取单个环境

```http
GET /environments/:env
```

#### 3. 创建环境

```http
POST /environments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "staging",
  "displayName": "预发布环境",
  "description": "用于预发布测试"
}
```

#### 4. 获取环境下的所有服务

```http
GET /environments/:env/services
```

### 版本管理 API

#### 1. 获取版本历史

```http
GET /versions/:env/:service/:key?limit=10
```

**响应示例:**
```json
{
  "environment": "dev",
  "service": "user-service",
  "key": "database.host",
  "versions": [
    {
      "version": 3,
      "value": "new-host",
      "encrypted": false,
      "createdAt": "2024-01-03T00:00:00.000Z",
      "createdBy": "admin"
    }
  ],
  "count": 1
}
```

#### 2. 获取特定版本详情

```http
GET /versions/:env/:service/:key/:version
```

#### 3. 回滚到指定版本

```http
POST /versions/:env/:service/:key/rollback/:version
Authorization: Bearer <token>
```

#### 4. 比较两个版本

```http
GET /versions/:env/:service/:key/compare?v1=1&v2=2
```

### 审计日志 API

#### 获取审计日志

```http
GET /audit/:env/:service?limit=100
Authorization: Bearer <token>
```

### 实时订阅 API (SSE)

#### 订阅配置变更

```http
GET /subscribe/:env/:service
```

## 🔐 安全特性

### 配置加密

系统自动加密包含以下关键词的配置：
- `password`
- `secret`
- `token`
- `apikey`
- `private`
- `credential`

也可以通过 `encrypt: true` 参数强制加密任意配置。

### 认证方式

使用 Bearer Token 进行 API 认证。

**默认 Token（仅用于测试）:**
- 管理员: `admin-token`
- 普通用户: 任意其他 token

**生产环境请替换为真实的 JWT 或 OAuth 认证系统！**

## 📝 使用示例

### cURL

```bash
# 创建配置
curl -X POST \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"key":"api.timeout","value":"30000","description":"API超时时间"}' \
  http://localhost:8787/config/dev/user-service

# 获取配置
curl http://localhost:8787/config/dev/user-service/api.timeout

# 更新配置
curl -X PUT \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"value":"60000"}' \
  http://localhost:8787/config/dev/user-service/api.timeout

# 获取版本历史
curl http://localhost:8787/versions/dev/user-service/api.timeout
```

## 🏗️ 项目结构

```
config-service/
├── src/
│   ├── index.ts              # 主入口和路由
│   ├── types.ts              # TypeScript 类型定义
│   ├── handlers/             # 请求处理器
│   │   ├── config.ts         # 配置 CRUD 操作
│   │   ├── environment.ts    # 环境管理
│   │   └── version.ts        # 版本控制和审计
│   ├── services/             # 业务逻辑服务
│   │   ├── storage.ts        # KV 存储封装
│   │   ├── version.ts        # 版本控制逻辑
│   │   └── encryption.ts     # 加密服务
│   ├── middleware/           # 中间件
│   │   └── auth.ts           # 认证中间件
│   └── utils/                # 工具函数
│       ├── validation.ts     # 输入验证
│       └── crypto.ts         # 加密工具
├── package.json
├── tsconfig.json
├── wrangler.toml             # Cloudflare Workers 配置
└── README.md
```

## ⚙️ 配置说明

### Cloudflare KV 命名空间

需要创建 KV 命名空间：

```bash
wrangler kv:namespace create "CONFIG_KV"
```

### 环境变量

在 `wrangler.toml` 中配置：

```toml
[vars]
ENCRYPTION_KEY = "your-32-character-encryption-key"
```

**注意**: 生产环境请使用 Secrets 存储敏感信息：

```bash
wrangler secret put ENCRYPTION_KEY
```

## 📄 许可证

MIT License
