# 应用端 (Customer App)

## 应用说明

应用端是面向终端消费者的在线购物平台，提供商品浏览、下单购买、订单管理等功能。支持 Web、移动端 H5 和小程序多端部署。

## 技术栈

- **前端框架**: React 18 / Vue 3 / Taro (多端)
- **UI 组件库**: Ant Design Mobile / Vant
- **状态管理**: Redux Toolkit / Pinia
- **构建工具**: Vite / Webpack
- **开发语言**: TypeScript
- **HTTP 客户端**: Axios
- **路由**: React Router / Vue Router
- **端口**: 3001

## 主要功能模块

### 1. 首页
- 轮播广告
- 商品分类导航
- 热门商品推荐
- 促销活动入口
- 搜索框

### 2. 商品模块
- 商品分类浏览
- 商品列表（支持筛选、排序）
- 商品详情
- 商品评价
- 商品收藏
- 商品分享

### 3. 搜索模块
- 关键词搜索
- 搜索历史
- 热门搜索
- 搜索建议
- 搜索结果筛选

### 4. 购物车
- 商品添加/删除
- 数量调整
- 商品选择
- 价格计算
- 结算

### 5. 订单模块
- 订单确认
- 地址选择
- 支付方式选择
- 订单列表
- 订单详情
- 订单跟踪
- 申请退款
- 评价订单

### 6. 用户中心
- 个人信息
- 地址管理
- 收藏夹
- 优惠券
- 我的订单
- 售后服务
- 在线客服
- 设置

### 7. 支付模块
- 微信支付
- 支付宝支付
- 银联支付
- 余额支付

### 8. 营销活动
- 限时秒杀
- 优惠券领取
- 满减活动
- 新人优惠

## 项目结构

```
customer/
├── src/
│   ├── assets/          # 静态资源
│   ├── components/      # 公共组件
│   ├── views/          # 页面视图
│   │   ├── home/       # 首页
│   │   ├── category/   # 分类
│   │   ├── search/     # 搜索
│   │   ├── product/    # 商品详情
│   │   ├── cart/       # 购物车
│   │   ├── order/      # 订单
│   │   ├── user/       # 用户中心
│   │   └── payment/    # 支付
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
cd apps/customer
npm install
```

### 开发环境

```bash
# Web 端
npm run dev

# H5 端
npm run dev:h5

# 微信小程序
npm run dev:weapp
```

访问: http://localhost:3001

### 生产构建

```bash
# Web 端
npm run build

# H5 端
npm run build:h5

# 微信小程序
npm run build:weapp
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

# CDN 地址
VITE_CDN_URL=https://cdn.building-store.com

# WebSocket 地址
VITE_WS_URL=ws://localhost:8000/ws

# 微信 AppId（小程序）
VITE_WECHAT_APPID=your_wechat_appid
```

## 多端适配

应用端支持多端部署：

### Web 端
- 响应式设计
- PC 和移动端自适应
- PWA 支持

### H5 端
- 移动端优化
- 微信内嵌浏览器适配
- 分享功能

### 小程序端
- 微信小程序
- 支付宝小程序
- 抖音小程序

## 性能优化

- 路由懒加载
- 图片懒加载
- 虚拟列表
- 接口防抖节流
- 本地缓存
- CDN 加速

## 用户体验

- 骨架屏加载
- 下拉刷新
- 上拉加载更多
- 页面过渡动画
- 错误提示
- 加载状态

## 开发规范

详见主仓库的 [开发指南](../../docs/development.md)

## API 对接

应用端通过 API 网关与后端微服务通信：

- 用户注册/登录: `/api/v1/auth`
- 商品列表: `/api/v1/products`
- 商品详情: `/api/v1/products/:id`
- 购物车: `/api/v1/cart`
- 创建订单: `/api/v1/orders`
- 订单列表: `/api/v1/orders`
- 用户信息: `/api/v1/users/me`

详见 [API 设计文档](../../docs/api-design.md)

## 安全措施

- HTTPS 强制
- Token 认证
- 敏感信息加密
- XSS 防护
- CSRF 防护
- 输入验证
