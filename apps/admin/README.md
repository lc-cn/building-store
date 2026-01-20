# 管理端 (Admin Portal)

## 应用说明

管理端是面向商家和管理员的后台管理系统，提供完整的商品管理、订单管理、用户管理等功能。

## 技术栈

- **前端框架**: React 18 / Vue 3
- **UI 组件库**: Ant Design / Element Plus
- **状态管理**: Redux Toolkit / Pinia
- **构建工具**: Vite
- **开发语言**: TypeScript
- **HTTP 客户端**: Axios
- **路由**: React Router / Vue Router
- **端口**: 3000

## 主要功能模块

### 1. 仪表盘
- 数据概览
- 销售统计
- 订单趋势
- 库存预警

### 2. 商品管理
- 商品列表
- 商品分类管理
- 商品上架/下架
- 商品编辑
- 批量导入/导出

### 3. 订单管理
- 订单列表
- 订单详情
- 订单状态更新
- 退款处理
- 物流跟踪

### 4. 用户管理
- 用户列表
- 用户详情
- 用户权限管理
- 用户标签
- 用户行为分析

### 5. 库存管理
- 库存查询
- 库存调整
- 出入库记录
- 库存预警设置

### 6. 营销管理
- 优惠券管理
- 促销活动
- 广告位管理
- 推荐位配置

### 7. 财务管理
- 交易流水
- 对账管理
- 退款记录
- 财务报表

### 8. 系统设置
- 角色权限管理
- 菜单配置
- 系统参数
- 操作日志

## 项目结构

```
admin/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 公共组件
│   ├── views/          # 页面视图
│   │   ├── dashboard/  # 仪表盘
│   │   ├── products/   # 商品管理
│   │   ├── orders/     # 订单管理
│   │   ├── users/      # 用户管理
│   │   ├── inventory/  # 库存管理
│   │   ├── marketing/  # 营销管理
│   │   ├── finance/    # 财务管理
│   │   └── system/     # 系统设置
│   ├── router/         # 路由配置
│   ├── store/          # 状态管理
│   ├── api/            # API 接口
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型定义
│   └── App.tsx         # 根组件
├── public/             # 公共资源
├── package.json        # 依赖配置
├── vite.config.ts     # Vite 配置
├── tsconfig.json      # TypeScript 配置
└── README.md          # 本文件
```

## 快速开始

### 安装依赖

```bash
cd apps/admin
npm install
```

### 开发环境

```bash
npm run dev
```

访问: http://localhost:3000

### 生产构建

```bash
npm run build
```

### 预览构建

```bash
npm run preview
```

## 环境变量

创建 `.env.local` 文件配置环境变量：

```env
# API 网关地址
VITE_API_BASE_URL=http://localhost:8000/api/v1

# 上传文件地址
VITE_UPLOAD_URL=http://localhost:8000/api/v1/upload

# WebSocket 地址
VITE_WS_URL=ws://localhost:8000/ws
```

## 权限控制

管理端采用基于角色的访问控制（RBAC）：

- **超级管理员**: 拥有所有权限
- **管理员**: 商品、订单、用户管理权限
- **运营人员**: 商品、营销管理权限
- **客服人员**: 订单、用户查询权限
- **财务人员**: 财务数据查看权限

## 开发规范

详见主仓库的 [开发指南](../../docs/development.md)

## API 对接

管理端通过 API 网关与后端微服务通信：

- 用户认证: `/api/v1/auth/login`
- 商品管理: `/api/v1/products`
- 订单管理: `/api/v1/orders`
- 用户管理: `/api/v1/users`
- 库存管理: `/api/v1/inventory`

详见 [API 设计文档](../../docs/api-design.md)
