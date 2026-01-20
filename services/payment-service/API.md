# Payment Service API 文档

## 概述

支付服务提供了完整的支付、退款和余额管理功能。

## API 路由

### 支付管理

#### 1. 获取支付记录列表
```
GET /payments
```

查询参数：
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `user_id`: 用户ID（可选）
- `status`: 支付状态（可选）- pending, processing, completed, failed, cancelled, refunded
- `order_id`: 订单ID（可选）

响应：
```json
{
  "data": [
    {
      "id": 1,
      "payment_number": "PAY202312251234567",
      "order_id": "ORD123",
      "user_id": 1,
      "amount": 100.00,
      "currency": "CNY",
      "payment_method": "wechat",
      "status": "completed",
      "created_at": "2023-12-25T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### 2. 创建支付记录
```
POST /payments
```

请求体：
```json
{
  "order_id": "ORD123",
  "user_id": 1,
  "amount": 100.00,
  "currency": "CNY",
  "payment_method": "wechat",
  "payment_provider": "wechat_pay",
  "note": "订单支付"
}
```

#### 3. 获取支付详情
```
GET /payments/:id
```

#### 4. 更新支付记录
```
PUT /payments/:id
```

请求体：
```json
{
  "status": "processing",
  "provider_transaction_id": "wx123456",
  "note": "更新备注"
}
```

#### 5. 完成支付
```
POST /payments/:id/complete
```

请求体（可选）：
```json
{
  "provider_transaction_id": "wx123456"
}
```

#### 6. 支付失败
```
POST /payments/:id/fail
```

请求体（可选）：
```json
{
  "reason": "余额不足"
}
```

### 退款管理

#### 1. 获取退款记录列表
```
GET /refunds
```

查询参数：
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `user_id`: 用户ID（可选）
- `status`: 退款状态（可选）- pending, processing, completed, failed, rejected
- `payment_id`: 支付ID（可选）

#### 2. 创建退款记录
```
POST /refunds
```

请求体：
```json
{
  "payment_id": 1,
  "amount": 50.00,
  "reason": "商品质量问题",
  "created_by": 1
}
```

#### 3. 获取退款详情
```
GET /refunds/:id
```

#### 4. 更新退款记录
```
PUT /refunds/:id
```

请求体：
```json
{
  "status": "processing",
  "provider_refund_id": "ref123",
  "note": "更新备注"
}
```

#### 5. 批准退款
```
POST /refunds/:id/approve
```

请求体（可选）：
```json
{
  "operator_id": 1
}
```

#### 6. 拒绝退款
```
POST /refunds/:id/reject
```

请求体（可选）：
```json
{
  "reason": "不符合退款条件"
}
```

### 余额管理

#### 1. 查询用户余额
```
GET /balance/:user_id
```

响应：
```json
{
  "id": 1,
  "user_id": 1,
  "available_balance": 1000.00,
  "frozen_balance": 0.00,
  "total_recharged": 2000.00,
  "total_spent": 1000.00,
  "created_at": "2023-12-25T10:00:00Z",
  "updated_at": "2023-12-25T10:00:00Z"
}
```

#### 2. 充值
```
POST /balance/recharge
```

请求体：
```json
{
  "user_id": 1,
  "amount": 100.00,
  "payment_method": "wechat",
  "note": "充值"
}
```

#### 3. 余额变动记录
```
GET /balance/:user_id/transactions
```

查询参数：
- `page`: 页码（默认 1）
- `limit`: 每页数量（默认 20）
- `type`: 交易类型（可选）- recharge, payment, refund, freeze, unfreeze, withdraw

响应：
```json
{
  "data": [
    {
      "id": 1,
      "user_id": 1,
      "type": "recharge",
      "amount": 100.00,
      "before_balance": 900.00,
      "after_balance": 1000.00,
      "note": "充值 100.00元",
      "created_at": "2023-12-25T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

#### 4. 冻结余额
```
POST /balance/:user_id/freeze
```

请求体：
```json
{
  "amount": 50.00,
  "note": "订单冻结"
}
```

#### 5. 解冻余额
```
POST /balance/:user_id/unfreeze
```

请求体：
```json
{
  "amount": 50.00,
  "note": "订单完成"
}
```

## 支付状态流转

支付记录的状态流转规则：

```
pending -> processing -> completed
pending -> processing -> failed
pending -> cancelled
completed -> refunded
```

## 退款状态流转

退款记录的状态流转规则：

```
pending -> processing -> completed
pending -> rejected
processing -> failed
```

## 余额操作

所有余额操作都具有事务性，确保数据一致性：

1. **充值**：增加可用余额和累计充值金额
2. **支付**：减少可用余额，增加累计消费金额
3. **退款**：增加可用余额，减少累计消费金额
4. **冻结**：从可用余额转移到冻结余额
5. **解冻**：从冻结余额转移到可用余额

每次余额操作都会在 `balance_transactions` 表中记录变动历史。

## 数据验证

### 支付验证
- 金额必须大于 0
- 状态流转必须符合规则
- 必填字段：order_id, user_id, amount, payment_method

### 退款验证
- 只能对已完成的支付进行退款
- 退款金额必须大于 0 且不能超过原支付金额
- 累计退款金额不能超过原支付金额
- 状态流转必须符合规则

### 余额验证
- 充值金额必须大于 0
- 扣款时检查可用余额是否充足
- 冻结时检查可用余额是否充足
- 解冻时检查冻结余额是否充足

## 错误处理

所有 API 在出错时返回 JSON 格式的错误信息：

```json
{
  "error": "错误描述"
}
```

常见 HTTP 状态码：
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 环境配置

服务需要配置 D1 数据库绑定（在 wrangler.toml 中）：

```toml
[[d1_databases]]
binding = "DB"
database_name = "payment-db"
database_id = "your-database-id"
```
