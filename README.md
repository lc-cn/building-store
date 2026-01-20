# Building Store - 建筑商店

一个基于微服务架构的建筑材料电商平台（Monorepo）

## 项目概述

Building Store 是一个采用微服务架构设计的建筑材料在线商店系统。本项目采用 Monorepo 方式组织代码，将后端服务拆分为多个独立的微服务模块，实现核心服务与边缘服务的解耦，提高系统的可维护性、可扩展性和可靠性。

## 架构设计

### 微服务架构原则

1. **服务自治**: 每个微服务独立开发、部署和扩展
2. **数据隔离**: 每个服务拥有独立的数据存储
3. **接口标准化**: 使用RESTful API和gRPC进行服务间通信
4. **容错设计**: 实现服务降级、熔断和限流机制
5. **可观测性**: 统一的日志、监控和链路追踪

### 服务分层

#### 核心服务层 (Core Services)

核心服务层包含业务核心逻辑，各服务在 `services/` 目录下独立管理：

1. **用户服务 (user-service)**
   - 目录: `services/user-service/`
   - 功能: 用户注册、登录、个人信息管理、权限管理
   - 数据库: PostgreSQL
   - 端口: 8001

2. **产品服务 (product-service)**
   - 目录: `services/product-service/`
   - 功能: 产品目录管理、分类管理、产品搜索、价格管理
   - 数据库: PostgreSQL + Elasticsearch (搜索)
   - 端口: 8002

3. **订单服务 (order-service)**
   - 目录: `services/order-service/`
   - 功能: 订单创建、订单状态管理、订单查询、订单历史
   - 数据库: PostgreSQL
   - 端口: 8003

4. **库存服务 (inventory-service)**
   - 目录: `services/inventory-service/`
   - 功能: 库存管理、库存预留、库存释放、库存同步
   - 数据库: PostgreSQL + Redis (缓存)
   - 端口: 8004

5. **支付服务 (payment-service)**
   - 目录: `services/payment-service/`
   - 功能: 支付处理、退款处理、支付回调、账单管理
   - 数据库: PostgreSQL
   - 端口: 8005

#### 边缘服务层 (Edge Services)

边缘服务层负责流量管理、安全认证等非业务核心功能：

1. **API 网关 (api-gateway)**
   - 目录: `services/api-gateway/`
   - 功能: 路由转发、负载均衡、限流熔断、协议转换
   - 技术栈: Kong / Nginx / Spring Cloud Gateway
   - 端口: 8000

2. **认证服务 (auth-service)**
   - 目录: `services/auth-service/`
   - 功能: JWT令牌生成、令牌验证、OAuth2.0、单点登录
   - 数据库: Redis (令牌存储)
   - 端口: 8006

3. **通知服务 (notification-service)**
   - 目录: `services/notification-service/`
   - 功能: 邮件通知、短信通知、站内消息、推送通知
   - 数据库: MongoDB
   - 端口: 8007

#### 基础设施服务 (Infrastructure Services)

1. **配置中心 (config-service)**
   - 目录: `services/config-service/`
   - 功能: 集中配置管理、动态配置更新
   - 技术栈: Spring Cloud Config / Consul

2. **服务注册与发现 (service-registry)**
   - 目录: `services/service-registry/`
   - 功能: 服务注册、服务发现、健康检查
   - 技术栈: Consul / Eureka / Nacos

### 前端应用层 (Frontend Applications)

#### To B 管理端 (Admin Portal)

**管理端 (admin)**
- 目录: `apps/admin/`
- 功能: 面向商家和管理员的后台管理系统
- 技术栈: React 18 / Vue 3 + Ant Design / Element Plus
- 端口: 3000

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

**应用端 (customer)**
- 目录: `apps/customer/`
- 功能: 面向终端消费者的在线购物平台
- 技术栈: React 18 / Vue 3 / Taro (多端)
- 端口: 3001
- 支持: Web、H5、小程序多端部署

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

### 前端应用
- **框架**: React 18 / Vue 3 / Taro (多端)
- **UI 组件库**: Ant Design / Element Plus / Vant
- **状态管理**: Redux Toolkit / Pinia
- **构建工具**: Vite / Webpack
- **开发语言**: TypeScript
- **HTTP 客户端**: Axios
- **路由**: React Router / Vue Router
- **样式**: Tailwind CSS / Less / Sass
- **多端支持**: Web、H5、微信小程序、支付宝小程序

### 后端服务
- **开发语言**: Node.js (TypeScript) / Java (Spring Boot) / Go
- **API框架**: Express / Spring Boot / Gin
- **数据库**: PostgreSQL (主数据库)
- **缓存**: Redis
- **搜索**: Elasticsearch
- **消息队列**: RabbitMQ / Kafka
- **服务通信**: REST API / gRPC

### 基础设施
- **容器化**: Docker
- **编排**: Kubernetes
- **服务网格**: Istio (可选)
- **API网关**: Kong / Nginx
- **配置中心**: Consul / Nacos
- **服务注册**: Consul / Eureka

### 监控与日志
- **日志**: ELK Stack (Elasticsearch + Logstash + Kibana)
- **监控**: Prometheus + Grafana
- **链路追踪**: Jaeger / Zipkin
- **告警**: AlertManager

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
- Docker & Docker Compose
- Node.js 18+ / Java 17+ / Go 1.20+
- PostgreSQL 14+
- Redis 7+

### 本地开发环境搭建

```bash
# 克隆仓库
git clone https://github.com/lc-cn/building-store.git
cd building-store

# 运行环境搭建脚本
./scripts/setup.sh

# 启动基础设施服务（数据库、缓存、消息队列等）
docker compose -f docker/docker-compose.yml up -d

# 启动后端服务（以用户服务为例）
cd services/user-service
npm install
npm run dev

# 启动前端应用
# 管理端
cd apps/admin
npm install
npm run dev  # 访问 http://localhost:3000

# 应用端
cd apps/customer
npm install
npm run dev  # 访问 http://localhost:3001
```

### 应用列表

#### 前端应用

| 应用名称 | 目录 | 端口 | 说明 | 文档 |
|---------|------|------|------|------|
| 管理端 | `apps/admin/` | 3000 | To B 后台管理系统 | [文档](apps/admin/README.md) |
| 应用端 | `apps/customer/` | 3001 | To C 在线购物平台 | [文档](apps/customer/README.md) |

#### 后端服务

| 服务名称 | 目录 | 端口 | 文档 |
|---------|------|------|------|
| API Gateway | `services/api-gateway/` | 8000 | [文档](services/api-gateway/README.md) |
| 用户服务 | `services/user-service/` | 8001 | [文档](services/user-service/README.md) |
| 产品服务 | `services/product-service/` | 8002 | [文档](services/product-service/README.md) |
| 订单服务 | `services/order-service/` | 8003 | [文档](services/order-service/README.md) |
| 库存服务 | `services/inventory-service/` | 8004 | [文档](services/inventory-service/README.md) |
| 支付服务 | `services/payment-service/` | 8005 | [文档](services/payment-service/README.md) |
| 认证服务 | `services/auth-service/` | 8006 | [文档](services/auth-service/README.md) |
| 通知服务 | `services/notification-service/` | 8007 | [文档](services/notification-service/README.md) |
| 配置中心 | `services/config-service/` | - | [文档](services/config-service/README.md) |
| 服务注册 | `services/service-registry/` | - | [文档](services/service-registry/README.md) |

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
