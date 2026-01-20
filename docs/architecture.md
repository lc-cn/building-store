# 微服务架构设计文档

## 1. 架构概述

Building Store 采用微服务架构，将系统划分为多个独立的服务单元，每个服务负责特定的业务功能。项目采用 Monorepo 方式组织，所有服务在同一个代码仓库中管理，位于 `services/` 目录下。服务之间通过轻量级通信机制（REST API、gRPC、消息队列）进行交互。

## 2. 架构原则

### 2.1 单一职责原则
每个微服务只负责一个业务领域，具有明确的边界和职责。

### 2.2 服务自治
- 独立开发和部署
- 独立的数据存储
- 独立的技术栈选型
- 独立的团队维护

### 2.3 去中心化治理
- 各服务可选择最适合的技术栈
- 分布式数据管理
- 去中心化决策

### 2.4 基础设施自动化
- 自动化测试
- 持续集成/持续部署 (CI/CD)
- 基础设施即代码 (IaC)

### 2.5 为失败而设计
- 服务降级
- 熔断器模式
- 超时和重试
- 限流保护

## 3. 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│          Web App  │  Mobile App  │  Third-party API         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      边缘服务层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ API Gateway  │  │ Auth Service │  │ Notification │      │
│  │   (8000)     │  │   (8006)     │  │   (8007)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心服务层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    User      │  │   Product    │  │    Order     │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  │   (8001)     │  │   (8002)     │  │   (8003)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │  Inventory   │  │   Payment    │                         │
│  │   Service    │  │   Service    │                         │
│  │   (8004)     │  │   (8005)     │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    基础设施服务层                            │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │    Config    │  │   Service    │                         │
│  │   Service    │  │   Registry   │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      数据存储层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ PostgreSQL   │  │    Redis     │  │ Elasticsearch│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐                         │
│  │   MongoDB    │  │  RabbitMQ    │                         │
│  └──────────────┘  └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

## 4. 服务详细设计

### 4.1 核心服务

#### 4.1.1 用户服务 (User Service)
**职责**: 用户账户管理和用户信息维护

**功能模块**:
- 用户注册与登录
- 用户信息管理（CRUD）
- 用户权限管理
- 用户角色管理
- 用户地址管理

**技术栈**:
- 语言: Node.js (TypeScript)
- 框架: Express.js
- 数据库: PostgreSQL
- 缓存: Redis

**对外接口**:
- `POST /api/v1/users/register` - 用户注册
- `POST /api/v1/users/login` - 用户登录
- `GET /api/v1/users/:id` - 获取用户信息
- `PUT /api/v1/users/:id` - 更新用户信息
- `DELETE /api/v1/users/:id` - 删除用户

#### 4.1.2 产品服务 (Product Service)
**职责**: 产品目录和产品信息管理

**功能模块**:
- 产品CRUD操作
- 产品分类管理
- 产品搜索（全文搜索）
- 产品价格管理
- 产品图片管理

**技术栈**:
- 语言: Java (Spring Boot)
- 框架: Spring Boot
- 数据库: PostgreSQL
- 搜索引擎: Elasticsearch
- 缓存: Redis

**对外接口**:
- `GET /api/v1/products` - 获取产品列表
- `GET /api/v1/products/:id` - 获取产品详情
- `POST /api/v1/products` - 创建产品
- `PUT /api/v1/products/:id` - 更新产品
- `DELETE /api/v1/products/:id` - 删除产品
- `GET /api/v1/products/search` - 搜索产品

#### 4.1.3 订单服务 (Order Service)
**职责**: 订单生命周期管理

**功能模块**:
- 订单创建
- 订单状态管理
- 订单查询
- 订单历史记录
- 订单取消和退款

**技术栈**:
- 语言: Go
- 框架: Gin
- 数据库: PostgreSQL
- 消息队列: RabbitMQ

**对外接口**:
- `POST /api/v1/orders` - 创建订单
- `GET /api/v1/orders/:id` - 获取订单详情
- `GET /api/v1/orders` - 获取订单列表
- `PUT /api/v1/orders/:id/status` - 更新订单状态
- `DELETE /api/v1/orders/:id` - 取消订单

**订单状态流转**:
```
待支付 -> 已支付 -> 处理中 -> 已发货 -> 已完成
   │         │         │
   └─────────┴─────────┴──> 已取消
```

#### 4.1.4 库存服务 (Inventory Service)
**职责**: 库存管理和库存控制

**功能模块**:
- 库存查询
- 库存预留
- 库存释放
- 库存调整
- 库存同步

**技术栈**:
- 语言: Node.js (TypeScript)
- 框架: Express.js
- 数据库: PostgreSQL
- 缓存: Redis（库存缓存）

**对外接口**:
- `GET /api/v1/inventory/:productId` - 查询库存
- `POST /api/v1/inventory/reserve` - 预留库存
- `POST /api/v1/inventory/release` - 释放库存
- `PUT /api/v1/inventory/:productId` - 更新库存

#### 4.1.5 支付服务 (Payment Service)
**职责**: 支付处理和支付管理

**功能模块**:
- 支付创建
- 支付确认
- 支付回调处理
- 退款处理
- 支付记录查询

**技术栈**:
- 语言: Java (Spring Boot)
- 框架: Spring Boot
- 数据库: PostgreSQL
- 消息队列: RabbitMQ

**对外接口**:
- `POST /api/v1/payments` - 创建支付
- `GET /api/v1/payments/:id` - 查询支付状态
- `POST /api/v1/payments/:id/confirm` - 确认支付
- `POST /api/v1/payments/:id/refund` - 申请退款
- `POST /api/v1/payments/callback` - 支付回调

### 4.2 边缘服务

#### 4.2.1 API 网关 (API Gateway)
**职责**: 统一入口、路由、负载均衡、协议转换

**功能模块**:
- 请求路由
- 负载均衡
- 协议转换（HTTP/HTTPS/WebSocket）
- API版本管理
- 限流和熔断
- 请求日志记录

**技术栈**: Kong / Nginx / Spring Cloud Gateway

**核心功能**:
- 路由配置
- 插件系统（认证、限流、日志等）
- 服务发现集成
- 健康检查

#### 4.2.2 认证服务 (Auth Service)
**职责**: 统一认证和授权

**功能模块**:
- JWT令牌生成
- 令牌验证
- 令牌刷新
- OAuth 2.0支持
- 单点登录（SSO）

**技术栈**:
- 语言: Node.js (TypeScript)
- 框架: Express.js
- 存储: Redis（令牌黑名单）

**对外接口**:
- `POST /api/v1/auth/token` - 生成令牌
- `POST /api/v1/auth/verify` - 验证令牌
- `POST /api/v1/auth/refresh` - 刷新令牌
- `POST /api/v1/auth/logout` - 登出

#### 4.2.3 通知服务 (Notification Service)
**职责**: 多渠道消息通知

**功能模块**:
- 邮件通知
- 短信通知
- 站内消息
- 推送通知
- 通知模板管理

**技术栈**:
- 语言: Node.js (TypeScript)
- 框架: Express.js
- 数据库: MongoDB
- 消息队列: RabbitMQ

### 4.3 基础设施服务

#### 4.3.1 配置中心 (Config Service)
**职责**: 集中配置管理

**功能**:
- 配置存储和版本管理
- 动态配置更新
- 配置加密
- 配置审计

**技术栈**: Spring Cloud Config / Consul

#### 4.3.2 服务注册与发现 (Service Registry)
**职责**: 服务注册和服务发现

**功能**:
- 服务注册
- 服务发现
- 健康检查
- 负载均衡策略

**技术栈**: Consul / Eureka / Nacos

## 5. 服务间通信

### 5.1 同步通信

#### REST API
- 用于客户端与服务的交互
- 用于简单的服务间调用
- 标准HTTP方法（GET, POST, PUT, DELETE）

#### gRPC
- 用于内部服务间高性能通信
- Protocol Buffers序列化
- 双向流支持

### 5.2 异步通信

#### 消息队列（RabbitMQ）
- 事件驱动架构
- 解耦服务依赖
- 异步处理
- 消息持久化

**主要事件**:
- `order.created` - 订单创建事件
- `order.paid` - 订单支付完成事件
- `inventory.updated` - 库存更新事件
- `payment.completed` - 支付完成事件
- `user.registered` - 用户注册事件

### 5.3 通信模式

#### 请求-响应模式
```
Client -> API Gateway -> Service -> Response
```

#### 发布-订阅模式
```
Order Service ──[order.created]──> Message Queue
                                        │
                     ┌──────────────────┼──────────────────┐
                     ▼                  ▼                  ▼
              Inventory Service  Payment Service  Notification Service
```

#### Saga模式（分布式事务）
```
Order Service (Create Order)
      │
      ├─> Inventory Service (Reserve Stock)
      │         │
      │         ├─> Success -> Payment Service (Process Payment)
      │         │                    │
      │         │                    ├─> Success -> Complete
      │         │                    └─> Failure -> Compensate
      │         │
      │         └─> Failure -> Compensate
      │
      └─> Failure -> Cancel Order
```

## 6. 数据管理

### 6.1 数据库设计原则

1. **数据库隔离**: 每个服务拥有独立的数据库
2. **共享数据最小化**: 避免跨服务直接访问数据库
3. **最终一致性**: 接受短暂的数据不一致
4. **事件溯源**: 记录所有状态变更事件

### 6.2 数据一致性策略

#### Saga模式
- 编排式Saga：中心协调器
- 事件驱动式Saga：事件链

#### 补偿机制
- 订单创建失败 -> 释放库存
- 支付失败 -> 取消订单、释放库存
- 库存不足 -> 取消订单

### 6.3 数据同步

#### 最终一致性
- 通过消息队列异步同步数据
- 定期对账和数据校验
- 补偿任务处理不一致数据

## 7. 安全设计

### 7.1 认证与授权

#### JWT认证
```
Client -> Login -> Auth Service -> JWT Token
Client -> Request with Token -> API Gateway -> Verify Token -> Service
```

#### RBAC授权
- 角色: Admin, Manager, Customer, Guest
- 权限: Read, Write, Delete
- 资源: User, Product, Order, etc.

### 7.2 服务间安全

- mTLS（双向TLS）
- API密钥
- 服务网格安全策略

### 7.3 数据安全

- 敏感数据加密（密码、支付信息）
- 传输加密（HTTPS/TLS）
- 数据脱敏
- 审计日志

## 8. 可观测性

### 8.1 日志管理

#### 日志标准
- 结构化日志（JSON格式）
- 统一日志格式
- 请求ID追踪

#### 日志收集
```
Services -> Filebeat -> Logstash -> Elasticsearch -> Kibana
```

### 8.2 监控指标

#### 业务指标
- 订单量、交易额
- 用户活跃度
- 转化率

#### 技术指标
- 服务健康状态
- API响应时间
- 错误率
- 吞吐量
- 资源使用率

#### 监控栈
```
Services -> Prometheus -> Grafana
```

### 8.3 链路追踪

#### 分布式追踪
```
Services -> Jaeger/Zipkin
```

- 跟踪请求在服务间的流转
- 性能瓶颈分析
- 依赖关系可视化

## 9. 容错与弹性

### 9.1 重试机制
- 指数退避
- 最大重试次数
- 幂等性保证

### 9.2 熔断器
- 快速失败
- 降级服务
- 自动恢复

### 9.3 限流
- 令牌桶算法
- 漏桶算法
- 滑动窗口

### 9.4 服务降级
- 返回缓存数据
- 返回默认值
- 功能降级

### 9.5 超时控制
- 连接超时
- 读取超时
- 整体超时

## 10. 部署架构

### 10.1 容器化

每个服务打包为Docker镜像：
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8001
CMD ["node", "dist/index.js"]
```

### 10.2 Kubernetes部署

#### Namespace隔离
- `building-store-prod` - 生产环境
- `building-store-dev` - 开发环境
- `building-store-test` - 测试环境

#### 服务部署
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: building-store/user-service:latest
        ports:
        - containerPort: 8001
```

#### 负载均衡
- Kubernetes Service
- Ingress Controller
- 服务网格（Istio）

### 10.3 自动扩展

#### HPA（水平Pod自动伸缩）
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 11. CI/CD流程

### 11.1 持续集成
```
Code Commit -> GitHub Actions
  -> Lint
  -> Unit Test
  -> Build
  -> Integration Test
  -> Build Docker Image
  -> Push to Registry
```

### 11.2 持续部署
```
Docker Image -> Deploy to K8s
  -> Rolling Update
  -> Health Check
  -> Smoke Test
  -> Complete / Rollback
```

### 11.3 发布策略

- **蓝绿部署**: 零停机部署
- **金丝雀发布**: 灰度发布，逐步放量
- **滚动更新**: 逐个替换实例

## 12. 性能优化

### 12.1 缓存策略

#### 多级缓存
1. 客户端缓存
2. CDN缓存
3. API网关缓存
4. 服务层缓存（Redis）
5. 数据库查询缓存

### 12.2 数据库优化

- 索引优化
- 查询优化
- 读写分离
- 分库分表
- 连接池管理

### 12.3 异步处理

- 消息队列异步化
- 批量操作
- 定时任务

## 13. 灾难恢复

### 13.1 备份策略

- 数据库定期备份
- 配置备份
- 代码版本控制

### 13.2 故障恢复

- 自动故障转移
- 跨区域部署
- 定期演练

## 14. 总结

本架构设计遵循微服务最佳实践，实现了：
1. ✅ 服务解耦和独立部署
2. ✅ 核心服务与边缘服务分离
3. ✅ 数据隔离和服务自治
4. ✅ 完整的可观测性方案
5. ✅ 容错和弹性设计
6. ✅ 自动化部署和扩展

该架构支持：
- 高可用性（99.9%+）
- 高性能（低延迟、高吞吐）
- 高可扩展性（水平扩展）
- 高可维护性（独立服务、清晰边界）
