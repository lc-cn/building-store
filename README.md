# 🏗️ Building Store (建材商城)

一个基于 pnpm + TypeScript 的建材商城全栈 Monorepo 项目，包含后端 API、管理后台和移动端应用。

## 📋 项目概述

Building Store 是一个完整的建材电商解决方案，采用现代化的技术栈和微服务架构设计。

### 技术栈

- **包管理**: pnpm (Monorepo)
- **语言**: TypeScript
- **后端**: NestJS + SQLite + TypeORM
- **管理后台**: Next.js + Tailwind CSS
- **移动端**: React Native (跨端)
- **代码规范**: ESLint + Prettier + Husky

## 🏗️ 项目结构

```
building-store/
├── packages/
│   ├── backend/          # NestJS 后端 API
│   ├── admin/            # Next.js 管理后台 (To B)
│   ├── mobile/           # React Native 移动端 (To C)
│   └── shared/           # 共享类型和工具库
├── .husky/               # Git hooks
├── pnpm-workspace.yaml   # pnpm 工作区配置
├── package.json          # 根配置
├── tsconfig.json         # TypeScript 基础配置
├── .prettierrc.json      # Prettier 配置
├── .eslintrc.json        # ESLint 配置
└── README.md             # 项目文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动所有服务
pnpm dev

# 启动后端
pnpm dev:backend

# 启动管理后台
pnpm dev:admin

# 启动移动端
pnpm dev:mobile
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建特定包
pnpm build:backend
pnpm build:admin
pnpm build:mobile
```

### 代码规范

```bash
# 检查代码格式
pnpm format:check

# 格式化代码
pnpm format

# ESLint 检查
pnpm lint

# ESLint 修复
pnpm lint:fix
```

### 测试

```bash
# 运行所有测试
pnpm test
```

## 📦 后端模块设计

### 核心模块列表

| 序号 | 模块名称 | 归属系统 | 优先级 | 状态 |
|------|---------|---------|--------|------|
| 1 | 用户管理 | 用户中心 | P0 | 🔲 待开发 |
| 2 | 角色管理 | 权限中心 | P0 | 🔲 待开发 |
| 3 | 商品管理 | 商品中心 | P0 | 🔲 待开发 |
| 4 | 商品单位管理 | 基础数据 | P1 | 🔲 待��发 |
| 5 | 仓库管理 | 仓储中心 | P0 | 🔲 待开发 |
| 6 | 库存管理 | 库存中心 | P0 | 🔲 待开发 |
| 7 | 订单管理 | 订单中心 | P0 | 🔲 待开发 |
| 8 | 代金券管理 | 营销中心 | P1 | 🔲 待开发 |
| 9 | 会员卡管理 | 会员中心 | P1 | 🔲 待开发 |
| 10 | 会员卡卡种管理 | 会员中心 | P1 | 🔲 待开发 |
| 11 | 商品分类管理 | 商品中心 | P0 | 🔲 待开发 |
| 12 | 商品规格管理 | 商品中心 | P0 | 🔲 待开发 |
| 13 | 地址管理 | 地址服务 | P0 | 🔲 待开发 |
| 14 | 配送管理 | 物流中心 | P0 | 🔲 待开发 |

### 模块架构

每个模块遵循标准的 NestJS 架构：
- **Controller**: 处理 HTTP 请求
- **Service**: 业务逻辑层
- **Entity**: 数据模型 (TypeORM)
- **DTO**: 数据传输对象
- **Repository**: 数据访问层

## 🎨 前端应用

### 管理后台 (Admin)
- **目标用户**: 商家、管理员 (To B)
- **技术栈**: Next.js 14 + Tailwind CSS + shadcn/ui
- **功能**: 商品管理、订单管理、库存管理、用户管理、营销管理等

### 移动端应用 (Mobile)
- **目标用户**: 终端消费者 (To C)
- **技术栈**: React Native + Expo
- **功能**: 商品浏览、下单购买、订单跟踪、会员中心等

## 📝 TODO List

### Phase 1: 项目初始化 ✅
- [x] 配置 pnpm workspace
- [x] 配置 TypeScript
- [x] 配置 ESLint + Prettier
- [x] 配置 Git Hooks (Husky + lint-staged)
- [x] 配置 Commitlint
- [x] 编写 README.md

### Phase 2: 后端基础架构 🔲
- [ ] 创建 NestJS 项目结构
- [ ] 配置 TypeORM + SQLite
- [ ] 实现认证模块 (JWT)
- [ ] 实现授权模块 (RBAC)
- [ ] 配置 Swagger API 文档
- [ ] 创建共享类型库 (@building-store/shared)
- [ ] 实现统一异常处理
- [ ] 实现日志系统
- [ ] 实现数据验证管道

### Phase 3: 核心业务模块 (P0) 🔲

#### 用户中心
- [ ] 用户管理模块
  - [ ] 用户注册/登录
  - [ ] 用户信息管理
  - [ ] 密码加密存储
  - [ ] 用户状态管理

#### 权限中心
- [ ] 角色管理模块
  - [ ] 角色 CRUD
  - [ ] 权限分配
  - [ ] RBAC 实现

#### 商品中心
- [ ] 商品管理模块
  - [ ] 商品 CRUD
  - [ ] 商品上下架
  - [ ] 商品图片上传
  - [ ] 商品搜索
- [ ] 商品分类管理
  - [ ] 分类树形结构
  - [ ] 分类 CRUD
- [ ] 商品规格管理
  - [ ] SKU 管理
  - [ ] 规格属性管理

#### 仓储中心
- [ ] 仓库管理模块
  - [ ] 仓库 CRUD
  - [ ] 仓库库位管理

#### 库存中心
- [ ] 库存管理模块
  - [ ] 库存查询
  - [ ] 库存预警
  - [ ] 出入库记录

#### 订单中心
- [ ] 订单管理模块
  - [ ] 订单创建
  - [ ] 订单状态流转
  - [ ] 订单支付
  - [ ] 订单取消/退款

#### 地址服务
- [ ] 地址管理模块
  - [ ] 收货地址 CRUD
  - [ ] 默认地址设置

#### 物流中心
- [ ] 配送管理模块
  - [ ] 配送单生成
  - [ ] 配送状态跟踪
  - [ ] 配送员管理

### Phase 4: 扩展业务模块 (P1) 🔲

#### 基础数据
- [ ] 商品单位管理模块
  - [ ] 单位 CRUD
  - [ ] 单位转换关系

#### 营销中心
- [ ] 代金券管理模块
  - [ ] 代金券创建
  - [ ] 代金券发放
  - [ ] 代金券使用规则

#### 会员中心
- [ ] 会员卡管理模块
  - [ ] 会员卡 CRUD
  - [ ] 会员积分管理
- [ ] 会员卡卡种管理
  - [ ] 卡种 CRUD
  - [ ] 卡种权益配置

### Phase 5: 管理后台开发 🔲
- [ ] 初始化 Next.js 项目
- [ ] 配置 Tailwind CSS
- [ ] 集成 shadcn/ui 组件库
- [ ] 实现布局框架
- [ ] 实现登录页面
- [ ] 实现首页仪表盘
- [ ] 实现用户管理页面
- [ ] 实现角色管理页面
- [ ] 实现商品管理页面
- [ ] 实现订单管理页面
- [ ] 实现库存管理页面
- [ ] 实现其他业务页面

### Phase 6: 移动端开发 🔲
- [ ] 初始化 React Native 项目
- [ ] 配置 Expo
- [ ] 实现导航结构
- [ ] 实现启动页
- [ ] 实现登录/注册页
- [ ] 实现首页
- [ ] 实现商品列表页
- [ ] 实现商品详情页
- [ ] 实现购物车
- [ ] 实现订单确认页
- [ ] 实现订单列表
- [ ] 实现个人中心

### Phase 7: 测试与优化 🔲
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 编写 E2E 测试
- [ ] 性能优化
- [ ] 安全加固
- [ ] API 文档完善

### Phase 8: 部署与运维 🔲
- [ ] 配置 Docker
- [ ] 编写部署文档
- [ ] 配置 CI/CD
- [ ] 监控系统接入
- [ ] 日志收集系统

## 🤝 贡献指南

### Commit 规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `build`: 构建系统
- `ci`: CI/CD
- `chore`: 其他修改

**Scope:**
- `backend`: 后端
- `admin`: 管理后台
- `mobile`: 移动端
- `shared`: 共享库
- `user`: 用户模块
- `auth`: 认证模块
- `product`: 商品模块
- `order`: 订单模块
- 等...

### 开发流程

1. Fork 项目
2. 创建特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交更改 (`git commit -m 'feat(backend): add amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 创建 Pull Request

## 📄 License

MIT License

## 👥 作者

- [@lc-cn](https://github.com/lc-cn)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

**Status**: 🚧 项目初始化中...