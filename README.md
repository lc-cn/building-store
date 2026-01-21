# Building Store - 建筑商店

一个基于 Serverless 微服务架构的建筑材料电商平台（Monorepo）

## 项目概述

Building Store 是一个采用 Serverless 微服务架构设计的建筑材料在线商店系统。本项目采用 Monorepo 方式组织代码，将后端服务拆分为多个独立的微服务模块，**部署在 Cloudflare Workers** 上，实现核心服务与边缘服务的解耦，提高系统的可维护性、可扩展性和可靠性。

## 架构设计

### Serverless 微服务架构原则

1. **服务自治**: 每个微服务独立开发、部署和扩展
2. **数据隔离**: 每个服务拥有独立的数据存储（D1/KV）
3. **接口标准化**: 使用 RESTful API 进行服务间通信
4. **边缘计算**: 部署在 Cloudflare 全球边缘网络，零冷启动
5. **按需计费**: 按请求付费，无闲置成本
6. **自动扩展**: 根据流量自动扩展，无需手动管理

### 服务分层

#### 核心服务层 (Core Services) - Cloudflare Workers

核心服务层包含业务核心逻辑，各服务在 `services/` 目录下独立管理：

1. **用户服务 (user-service)**
   - 目录: `services/user-service/`
   - 功能: 用户注册、登录、个人信息管理、权限管理
   - 数据存储: Cloudflare D1 + KV
   - 部署: Cloudflare Workers

2. **产品服务 (product-service)**
   - 目录: `services/product-service/`
   - 功能: 产品目录管理、分类管理、产品搜索、价格管理
   - 数据存储: Cloudflare D1 + KV
   - 部署: Cloudflare Workers

3. **订单服务 (order-service)**
   - 目录: `services/order-service/`
   - 功能: 订单创建、订单状态管理、订单查询、订单历史
   - 数据存储: Cloudflare D1
   - 部署: Cloudflare Workers

4. **库存服务 (inventory-service)**
   - 目录: `services/inventory-service/`
   - 功能: 库存管理、库存预留、库存释放、库存同步
   - 数据存储: Cloudflare D1 + KV (缓存)
   - 部署: Cloudflare Workers

5. **支付服务 (payment-service)**
   - 目录: `services/payment-service/`
   - 功能: 支付处理、退款处理、支付回调、账单管理
   - 数据存储: Cloudflare D1
   - 部署: Cloudflare Workers

#### 边缘服务层 (Edge Services) - Cloudflare Workers

边缘服务层负责流量管理、安全认证等非业务核心功能：

1. **API 网关 (api-gateway)**
   - 目录: `services/api-gateway/`
   - 功能: 路由转发、负载均衡、限流熔断、协议转换
   - 技术栈: Hono + Cloudflare Workers
   - 部署: Cloudflare Workers

2. **认证服务 (auth-service)**
   - 目录: `services/auth-service/`
   - 功能: JWT令牌生成、令牌验证、OAuth2.0、单点登录
   - 数据存储: Cloudflare KV (令牌存储)
   - 部署: Cloudflare Workers

3. **通知服务 (notification-service)**
   - 目录: `services/notification-service/`
   - 功能: 邮件通知、短信通知、站内消息、推送通知
   - 数据存储: Cloudflare D1
   - 部署: Cloudflare Workers

#### 基础设施服务 (Infrastructure Services) - Cloudflare Workers

1. **配置中心 (config-service)**
   - 目录: `services/config-service/`
   - 功能: 集中配置管理、动态配置更新
   - 数据存储: Cloudflare KV
   - 部署: Cloudflare Workers

2. **服务注册与发现 (service-registry)**
   - 目录: `services/service-registry/`
   - 功能: 服务注册、服务发现、健康检查
   - 数据存储: Cloudflare KV
   - 部署: Cloudflare Workers

### 前端应用层 (Frontend Applications)

#### To B 管理端 (Admin Portal)

**管理端 (admin)** - React Native 移动应用
- 目录: `apps/admin/`
- 功能: 面向商家和管理员的移动端后台管理系统
- 技术栈: **React Native 0.72** + TypeScript
- 平台: iOS / Android

主要功能：
- 仪表盘：数据概览、销售统计、订单趋势
- 商品管理：商品 CRUD、分类管理、批量导入/导出
- 订单管理：订单处理、状态更新、退款管理、物流跟踪
- 用户管理：用户信息、权限管理、行为分析
- 库存管理：库存查询、调整、预警
- 营销管理：优惠券、促销活动、广告位
- 财务管理：交易流水、对账、财务报表
- 系统设置：角色权限、菜单配置、系统参数

#### To C 应用端 (Customer App)

**应用端 (customer)** - React Native 移动应用
- 目录: `apps/customer/`
- 功能: 面向终端消费者的移动端在线购物平台
- 技术栈: **React Native 0.72** + TypeScript
- 平台: iOS / Android

主要功能：
- 首页：轮播广告、分类导航、热门推荐、搜索
- 商品模块：分类浏览、商品详情、评价、收藏、分享
- 搜索模块：关键词搜索、历史记录、热门搜索
- 购物车：商品管理、数量调整、价格计算
- 订单模块：下单、支付、订单跟踪、退款、评价
- 用户中心：个人信息、地址管理、优惠券、收藏
- 支付模块：微信支付、支付宝、银联、余额支付
- 营销活动：秒杀、优惠券、满减活动

## Monorepo 仓库结构

本项目采用 Monorepo 方式组织，所有微服务和前端应用在同一个仓库中管理：

```
building-store/
├── apps/                           # 前端应用
│   ├── admin/                     # 管理端 (To B)
│   └── customer/                  # 应用端 (To C)
├── services/                      # 后端微服务
│   ├── user-service/             # 用户服务
│   ├── product-service/          # 产品服务
│   ├── order-service/            # 订单服务
│   ├── inventory-service/        # 库存服务
│   ├── payment-service/          # 支付服务
│   ├── api-gateway/              # API网关
│   ├── auth-service/             # 认证服务
│   ├── notification-service/     # 通知服务
│   ├── config-service/           # 配置中心
│   └── service-registry/         # 服务注册与发现
├── docs/                          # 架构文档
│   ├── architecture.md           # 架构设计文档
│   ├── api-design.md            # API设计规范
│   ├── database-design.md       # 数据库设计
│   ├── deployment.md            # 部署指南
│   └── development.md           # 开发指南
├── scripts/                      # 工具脚本
│   ├── setup.sh                 # 环境搭建脚本
│   └── deploy.sh                # 部署脚本
├── docker/                       # Docker配置
│   ├── docker-compose.yml       # 本地开发环境
│   └── docker-compose.prod.yml  # 生产环境
├── kubernetes/                   # K8s配置
│   ├── namespace.yaml
│   ├── services/                # 各服务的K8s配置
│   └── ingress.yaml
└── README.md                     # 本文件
```

## Monorepo 优势

采用 Monorepo 方式管理微服务具有以下优势：

1. **统一管理**: 所有服务代码在一个仓库，便于统一管理和维护
2. **代码共享**: 共享库和工具代码可以轻松在服务间复用
3. **原子提交**: 跨服务的更改可以在一个提交中完成，保持一致性
4. **统一CI/CD**: 所有服务使用统一的CI/CD流程
5. **版本同步**: 避免多仓库版本不一致的问题
6. **重构便利**: 跨服务重构更加容易和安全

## 技术栈

### 前端应用 (React Native)
- **框架**: React Native 0.72
- **开发语言**: TypeScript
- **导航**: React Navigation
- **HTTP 客户端**: Axios
- **状态管理**: Context API / Redux Toolkit (可选)
- **本地存储**: AsyncStorage
- **平台**: iOS / Android

### 后端服务 (Cloudflare Workers - Serverless)
- **运行时**: Cloudflare Workers Runtime
- **开发语言**: TypeScript
- **Web 框架**: Hono (轻量级、高性能)
- **数据库**: Cloudflare D1 (SQL数据库)
- **缓存/KV**: Cloudflare KV
- **部署工具**: Wrangler CLI
- **服务通信**: REST API

### Cloudflare 平台服务
- **计算**: Cloudflare Workers (Serverless)
- **数据库**: Cloudflare D1 (SQLite-based)
- **键值存储**: Cloudflare KV
- **对象存储**: Cloudflare R2
- **队列**: Cloudflare Queues
- **分析**: Cloudflare Analytics
- **DNS**: Cloudflare DNS

### 监控与日志
- **日志**: Cloudflare Workers Logpush
- **监控**: Cloudflare Analytics Dashboard
- **性能追踪**: Workers Analytics Engine
- **告警**: Cloudflare Notifications

## Serverless 架构优势

1. **零冷启动**: Cloudflare Workers 在全球边缘运行，无冷启动延迟
2. **全球部署**: 自动部署到 Cloudflare 全球 300+ 数据中心
3. **按需计费**: 只为实际请求付费，无闲置成本
4. **自动扩展**: 根据流量自动扩展，无需手动管理
5. **高可用性**: 内置容错和故障转移
6. **低延迟**: 边缘计算，就近响应用户请求

## 服务间通信

### 同步通信
- **REST API**: 用于外部客户端和服务间的同步调用
- **gRPC**: 用于内部服务间的高性能通信

### 异步通信
- **消息队列**: 用于事件驱动架构和异步处理
  - 订单创建事件
  - 库存变更事件
  - 支付完成事件
  - 通知事件

### 通信模式
1. **请求-响应**: API Gateway -> 各微服务
2. **事件驱动**: 订单服务 -> 库存服务/支付服务/通知服务
3. **发布-订阅**: 产品更新 -> 多个订阅服务

## 数据管理策略

### 数据库设计原则
1. 每个服务拥有独立的数据库实例
2. 服务间不直接访问其他服务的数据库
3. 通过API或消息队列进行数据交互
4. 实现最终一致性而非强一致性

### 分布式事务
采用 Saga 模式处理跨服务事务：
- **编排式**: 订单服务作为编排器协调各服务
- **事件驱动式**: 通过事件链实现分布式事务

## 快速开始

### 前置要求
- Node.js 18+
- Cloudflare 账号 (免费套餐即可)
- Wrangler CLI (`npm install -g wrangler`)

### 本地开发环境搭建

```bash
# 克隆仓库
git clone https://github.com/lc-cn/building-store.git
cd building-store

# 登录 Cloudflare
wrangler login

# 启动后端服务（以用户服务为例）
cd services/user-service
npm install
npm run dev  # 本地开发服务器在 http://localhost:8787

# 部署到 Cloudflare Workers
npm run deploy

# 启动前端应用
# 管理端 (React Native)
cd apps/admin
npm install
# iOS
npm run ios
# Android
npm run android

# 应用端 (React Native)
cd apps/customer
npm install
# iOS
npm run ios
# Android
npm run android
```

### 应用列表

#### 前端应用 (React Native)

| 应用名称 | 目录 | 平台 | 说明 | 文档 |
|---------|------|------|------|------|
| 管理端 | `apps/admin/` | iOS / Android | To B 移动端后台管理系统 | [文档](apps/admin/README.md) |
| 应用端 | `apps/customer/` | iOS / Android | To C 移动端在线购物平台 | [文档](apps/customer/README.md) |

#### 后端服务 (Cloudflare Workers - Serverless)

| 服务名称 | 目录 | 部署平台 | 文档 |
|---------|------|---------|------|
| API Gateway | `services/api-gateway/` | Cloudflare Workers | [文档](services/api-gateway/README.md) |
| 用户服务 | `services/user-service/` | Cloudflare Workers | [文档](services/user-service/README.md) |
| 产品服务 | `services/product-service/` | Cloudflare Workers | [文档](services/product-service/README.md) |
| 订单服务 | `services/order-service/` | Cloudflare Workers | [文档](services/order-service/README.md) |
| 库存服务 | `services/inventory-service/` | Cloudflare Workers | [文档](services/inventory-service/README.md) |
| 支付服务 | `services/payment-service/` | Cloudflare Workers | [文档](services/payment-service/README.md) |
| 认证服务 | `services/auth-service/` | Cloudflare Workers | [文档](services/auth-service/README.md) |
| 通知服务 | `services/notification-service/` | Cloudflare Workers | [文档](services/notification-service/README.md) |
| 配置中心 | `services/config-service/` | Cloudflare Workers | [文档](services/config-service/README.md) |
| 服务注册 | `services/service-registry/` | Cloudflare Workers | [文档](services/service-registry/README.md) |

## 开发规范

### API 设计规范
- 遵循 RESTful 设计原则
- 使用统一的错误码和响应格式
- API版本管理: `/api/v1/`
- 详见 [API设计文档](docs/api-design.md)

### 代码规范
- 使用 ESLint / CheckStyle / golangci-lint
- 提交前运行代码格式化工具
- 编写单元测试和集成测试
- 代码覆盖率要求 > 80%

### Git 工作流
- 使用 Git Flow 工作流
- 分支命名规范: `feature/`, `bugfix/`, `hotfix/`
- 提交信息规范: 遵循 Conventional Commits

## 安全性

### 认证与授权
- JWT令牌认证
- RBAC (基于角色的访问控制)
- OAuth 2.0 支持

### 数据安全
- 敏感数据加密存储
- HTTPS 强制使用
- SQL 注入防护
- XSS 攻击防护

### 网络安全
- API 限流
- DDoS 防护
- 服务间 mTLS 加密

## 监控与运维

### 监控指标
- 服务健康状态
- API 响应时间
- 错误率
- 吞吐量
- 资源使用率

### 日志管理
- 结构化日志
- 集中式日志收集
- 日志级别管理
- 日志保留策略

### 告警策略
- 服务不可用告警
- 性能降级告警
- 错误率阈值告警
- 资源使用率告警

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 联系方式

- 项目维护者: lc-cn
- 项目主页: https://github.com/lc-cn/building-store
- 问题反馈: https://github.com/lc-cn/building-store/issues

## 路线图

### 第一阶段 (已完成)
- [x] 架构设计
- [x] 技术栈选型
- [x] Monorepo 结构规划

### 第二阶段 (进行中)
- [ ] 实现基础设施服务
- [ ] 实现核心服务
- [ ] 实现边缘服务

### 第三阶段 (计划中)
- [ ] 服务间通信实现
- [ ] 分布式事务处理
- [ ] 监控和日志系统
- [ ] CI/CD 流程

### 第四阶段 (计划中)
- [ ] 性能优化
- [ ] 安全加固
- [ ] 文档完善
- [ ] 生产环境部署

## 更新日志

### v0.1.0 (2026-01-20)
- 初始化项目
- 完成微服务架构设计
- 规划 Monorepo 服务拆分方案
- 定义核心服务和边缘服务
- 创建服务目录结构
