# 管理端 (Admin Portal)

## 应用说明

管理端是基于 **React Native** 开发的移动应用，面向商家和管理员提供完整的后台管理功能。支持 iOS 和 Android 双平台。

## 技术栈

- **前端框架**: React Native 0.72
- **开发语言**: TypeScript
- **导航**: React Navigation
- **HTTP 客户端**: Axios
- **状态管理**: Context API / Redux (可选)
- **本地存储**: AsyncStorage

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
│   ├── components/      # 公共组件
│   ├── screens/        # 页面视图
│   ├── navigation/     # 路由配置
│   ├── services/       # API 接口
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型定义
│   ├── hooks/          # 自定义 Hooks
│   ├── context/        # Context API
│   └── App.tsx         # 根组件
├── android/            # Android 原生代码
├── ios/                # iOS 原生代码
├── package.json        # 依赖配置
├── tsconfig.json      # TypeScript 配置
├── babel.config.js    # Babel 配置
└── README.md          # 本文件
```

## 快速开始

### 安装依赖

```bash
cd apps/admin
npm install
```

### iOS 开发

```bash
# 安装 iOS 依赖
cd ios && pod install && cd ..

# 运行 iOS 应用
npm run ios
```

### Android 开发

```bash
# 运行 Android 应用
npm run android
```

### 启动开发服务器

```bash
npm start
```

## 环境变量

创建 `.env` 文件配置环境变量：

```env
# API 网关地址
API_BASE_URL=http://localhost:8000/api/v1
```

## 构建发布

### iOS 构建

```bash
cd ios
xcodebuild -workspace BuildingStoreAdmin.xcworkspace -scheme BuildingStoreAdmin archive
```

### Android 构建

```bash
cd android
./gradlew assembleRelease
```

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
