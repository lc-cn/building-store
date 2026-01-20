# 用户服务 (User Service)

## 概述

用户服务负责管理系统中的用户账户、用户信息、用户权限和用户角色。

## 仓库地址

```
https://github.com/lc-cn/building-store-user-service
```

## 技术栈

- **语言**: Node.js (TypeScript)
- **框架**: Express.js
- **数据库**: PostgreSQL
- **缓存**: Redis
- **ORM**: TypeORM / Prisma
- **测试**: Jest

## 主要功能

### 1. 用户管理
- 用户注册
- 用户登录
- 用户信息查询
- 用户信息更新
- 用户删除
- 密码重置

### 2. 权限管理
- 角色管理（CRUD）
- 权限分配
- 权限验证
- RBAC（基于角色的访问控制）

### 3. 用户地址管理
- 地址添加
- 地址更新
- 地址删除
- 默认地址设置

## API接口

### 用户注册

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

响应:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "phone": "+86-13800138000",
    "createdAt": "2026-01-20T08:00:00Z"
  }
}
```

### 用户登录

```http
POST /api/v1/users/login
Content-Type: application/json

{
  "username": "zhangsan",
  "password": "SecurePassword123!"
}
```

响应:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "zhangsan",
      "email": "zhangsan@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 获取用户信息

```http
GET /api/v1/users/{userId}
Authorization: Bearer <token>
```

### 更新用户信息

```http
PUT /api/v1/users/{userId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "张三",
  "phone": "+86-13800138000"
}
```

## 数据库设计

### users 表

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(100),
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);
```

### roles 表

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_roles 表

```sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);
```

### addresses 表

```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    province VARCHAR(50),
    city VARCHAR(50),
    district VARCHAR(50),
    detail TEXT,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
);
```

## 环境变量

```bash
# 服务配置
PORT=8001
NODE_ENV=development

# 数据库配置
DATABASE_URL=postgresql://user_service_user:user_service_pass@localhost:5432/user_service_db

# Redis配置
REDIS_URL=redis://:redis123@localhost:6379

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# 服务注册
CONSUL_HOST=localhost
CONSUL_PORT=8500
SERVICE_NAME=user-service
SERVICE_PORT=8001
```

## 运行指南

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/lc-cn/building-store-user-service.git
cd building-store-user-service

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件

# 运行数据库迁移
npm run migrate

# 启动开发服务器
npm run dev
```

### Docker运行

```bash
# 构建镜像
docker build -t building-store/user-service:latest .

# 运行容器
docker run -d \
  -p 8001:8001 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  --name user-service \
  building-store/user-service:latest
```

## 测试

```bash
# 运行单元测试
npm run test

# 运行集成测试
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

## 监控指标

- 用户注册数
- 用户登录成功率
- API响应时间
- 活跃用户数
- 错误率

## 依赖服务

- PostgreSQL（数据存储）
- Redis（会话缓存）
- Consul（服务注册）
- RabbitMQ（事件发布）

## 事件发布

### user.registered
当用户注册成功时发布

```json
{
  "eventType": "user.registered",
  "timestamp": "2026-01-20T08:00:00Z",
  "data": {
    "userId": "user_123",
    "username": "zhangsan",
    "email": "zhangsan@example.com"
  }
}
```

### user.updated
当用户信息更新时发布

```json
{
  "eventType": "user.updated",
  "timestamp": "2026-01-20T08:00:00Z",
  "data": {
    "userId": "user_123",
    "updatedFields": ["name", "phone"]
  }
}
```

## 安全考虑

1. 密码使用bcrypt加密存储
2. JWT令牌有效期控制
3. API限流保护
4. 输入验证和清洗
5. SQL注入防护
6. XSS攻击防护

## 开发指南

详见主仓库的 [开发指南](../development.md)
