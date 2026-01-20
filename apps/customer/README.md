# 应用端 (Customer App)

## 应用说明

应用端是基于 **React Native** 开发的移动应用，面向终端消费者提供在线购物功能。支持 iOS 和 Android 双平台。

## 技术栈

- **前端框架**: React Native 0.72
- **开发语言**: TypeScript
- **导航**: React Navigation (底部标签 + 堆栈导航)
- **HTTP 客户端**: Axios
- **状态管理**: Context API / Redux (可选)
- **本地存储**: AsyncStorage
- **图片选择**: react-native-image-picker

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
cd apps/customer
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
xcodebuild -workspace BuildingStoreCustomer.xcworkspace -scheme BuildingStoreCustomer archive
```

### Android 构建

```bash
cd android
./gradlew assembleRelease
```

## 性能优化

- 图片懒加载
- 列表虚拟化
- 接口请求缓存
- 本地数据缓存
- 防抖和节流

## 用户体验

- 下拉刷新
- 上拉加载更多
- 页面转场动画
- 加载状态提示
- 错误提示

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

- Token 认证
- 敏感信息加密
- 输入验证
- HTTPS 通信
