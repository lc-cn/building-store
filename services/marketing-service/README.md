# 营销服务 (Marketing Service)

营销服务负责优惠券和促销活动的管理。

## 功能特性

### 优惠券管理
- 优惠券 CRUD
- 优惠券领取
- 优惠券使用
- 用户优惠券查询
- 多种优惠类型（满减、折扣、代金券）

## API 端点

### 优惠券
- `GET /coupons` - 获取优惠券列表
- `GET /coupons/:id` - 获取优惠券详情
- `POST /coupons` - 创建优惠券
- `PUT /coupons/:id` - 更新优惠券
- `DELETE /coupons/:id` - 删除优惠券
- `POST /coupons/:id/claim` - 领取优惠券
- `POST /user-coupons/:userCouponId/use` - 使用优惠券
- `GET /users/:userId/coupons` - 获取用户优惠券

## 数据库表结构

### coupons (优惠券表)
```sql
CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'full_reduction', 'discount', 'voucher'
  discount_type TEXT NOT NULL, -- 'fixed', 'percentage'
  discount_value REAL NOT NULL,
  min_amount REAL DEFAULT 0,
  max_discount REAL DEFAULT 0,
  total_count INTEGER NOT NULL,
  used_count INTEGER DEFAULT 0,
  per_user_limit INTEGER DEFAULT 1,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  description TEXT,
  conditions TEXT, -- JSON
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### user_coupons (用户优惠券表)
```sql
CREATE TABLE user_coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  coupon_id INTEGER NOT NULL,
  status TEXT DEFAULT 'unused', -- 'unused', 'used', 'expired'
  used_at TEXT,
  order_id INTEGER,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);
```

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 部署到 Cloudflare
npm run deploy

# 查看日志
npm run tail
```

## 使用示例

### 创建优惠券
```bash
curl -X POST http://localhost:8787/coupons \
  -H "Content-Type: application/json" \
  -d '{
    "name": "新用户专享券",
    "code": "NEW2024",
    "type": "full_reduction",
    "discount_type": "fixed",
    "discount_value": 20,
    "min_amount": 100,
    "total_count": 1000,
    "per_user_limit": 1,
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-12-31T23:59:59Z",
    "description": "满100减20"
  }'
```

### 领取优惠券
```bash
curl -X POST http://localhost:8787/coupons/1/claim \
  -H "Content-Type: application/json" \
  -d '{"user_id": 123}'
```
