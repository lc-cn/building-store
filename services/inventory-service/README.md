# Inventory Service (库存服务)

## 服务说明

库存服务基于 Cloudflare Workers 构建，提供完整的库存管理、预留、释放等功能。

## 技术栈

- **运行时**: Cloudflare Workers Runtime
- **框架**: Hono (轻量级Web框架)
- **数据库**: Cloudflare D1 (SQLite)
- **开发语言**: TypeScript

## 特点

- ✅ 全球边缘部署
- ✅ 零冷启动
- ✅ 自动扩展
- ✅ 按请求计费
- ✅ 高可用性
- ✅ 事务性库存操作
- ✅ 自动过期的库存预留
- ✅ 完整的库存变动历史

## 功能模块

### 库存管理
- ✅ SKU库存查询
- ✅ 库存调整（入库、出库、调整）
- ✅ 库存预留（支持过期时间）
- ✅ 库存释放
- ✅ 库存变动记录查询
- ✅ 过期预留自动清理

### 仓库管理
- ✅ 仓库列表查询
- ✅ 创建仓库
- ✅ 仓库详情查询
- ✅ 更新仓库信息
- ✅ 删除仓库
- ✅ 仓库库存统计

## 项目结构

```
inventory-service/
├── src/
│   ├── handlers/              # 路由处理器
│   │   ├── inventory.handler.ts
│   │   └── warehouse.handler.ts
│   ├── services/              # 业务逻辑层
│   │   ├── inventory.service.ts
│   │   └── warehouse.service.ts
│   ├── types.ts               # 类型定义
│   └── index.ts               # 主入口
├── schema.sql                 # 数据库表结构
├── API.md                     # API文档
├── wrangler.toml              # Cloudflare配置
├── tsconfig.json              # TypeScript配置
└── package.json
```

## 开发与部署

### 本地开发

```bash
cd services/inventory-service

# 安装依赖
npm install

# 本地开发
npm run dev
```

访问: http://localhost:8787

### 初始化数据库

```bash
# 创建 D1 数据库
wrangler d1 create building-store-inventory

# 执行数据库迁移
wrangler d1 execute building-store-inventory --file=./schema.sql

# 查询数据库
wrangler d1 execute building-store-inventory --command="SELECT * FROM warehouses"
```

### 部署到 Cloudflare

```bash
# 部署到生产环境
npm run deploy

# 部署到开发环境
wrangler deploy --env development
```

### 查看实时日志

```bash
npm run tail
```

## API 端点

完整的 API 文档请查看 [API.md](./API.md)

### 库存管理

- `GET /inventory/:sku` - 查询SKU库存
- `POST /inventory/adjust` - 库存调整
- `POST /inventory/reserve` - 库存预留
- `POST /inventory/release` - 库存释放
- `GET /inventory/transactions` - 库存变动记录
- `POST /inventory/cleanup-expired` - 清理过期预留

### 仓库管理

- `GET /warehouses` - 仓库列表
- `POST /warehouses` - 创建仓库
- `GET /warehouses/:id` - 仓库详情
- `PUT /warehouses/:id` - 更新仓库
- `DELETE /warehouses/:id` - 删除仓库
- `GET /warehouses/:id/stats` - 仓库库存统计

## 数据库表结构

### inventory - 库存表
存储商品库存信息，包括可用库存和预留库存。

### inventory_transactions - 库存变动记录表
记录所有库存变动历史，用于审计和追溯。

### inventory_reservations - 库存预留记录表
记录库存预留信息，支持设置过期时间。

### warehouses - 仓库表
存储仓库信息。

详细字段说明请查看 [schema.sql](./schema.sql)

## 核心业务流程

### 订单库存流程

```
1. 创建订单 → 预留库存 (reserve)
2. 支付成功 → 扣减库存 (adjust: out) + 释放预留 (release)
3. 订单取消 → 释放预留 (release)
4. 预留超时 → 自动释放 (cleanup-expired)
```

### 采购入库流程

```
1. 采购单到货 → 库存入库 (adjust: in)
2. 记录采购单号 → reference_type: purchase, reference_id: PO-xxx
```

## 配置说明

### wrangler.toml

需要配置 D1 数据库绑定：

```toml
[[d1_databases]]
binding = "DB"
database_name = "building-store-inventory"
database_id = "your-database-id-here"
```

获取 database_id：
```bash
wrangler d1 list
```

## 定时任务

建议配置定时任务清理过期的库存预留：

```toml
# wrangler.toml
[triggers]
crons = ["*/5 * * * *"]  # 每5分钟执行一次
```

## 测试

```bash
# 运行测试
npm test

# 类型检查
npx tsc --noEmit
```

## 环境变量

本服务主要依赖 D1 数据库绑定，无需额外的环境变量配置。

## 故障排查

### 数据库连接问题

确保 `wrangler.toml` 中配置了正确的数据库 ID：
```bash
wrangler d1 list
```

### 本地开发数据库

本地开发时使用的是本地 SQLite 数据库，数据不会持久化到 Cloudflare。

### 查看日志

```bash
# 实时日志
wrangler tail

# 查看最近的错误
wrangler tail --format=pretty
```

## 相关文档

- [API 文档](./API.md)
- [数据库表结构](./schema.sql)
- [主仓库文档](../../docs/development.md)
- [Hono 文档](https://hono.dev/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)

## 贡献

请遵循主仓库的贡献指南。
