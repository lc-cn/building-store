# 库存服务 API 文档

## 基本信息

- 服务名称：inventory-service
- 运行时：Cloudflare Workers
- 数据库：D1 (SQLite)

## API 端点

### 健康检查

#### GET /health
检查服务是否正常运行

**响应示例**
```json
{
  "status": "healthy",
  "service": "inventory-service",
  "runtime": "cloudflare-workers"
}
```

---

## 库存管理

### 1. 查询SKU库存

#### GET /inventory/:sku

**路径参数**
- `sku` - 商品SKU

**响应示例**
```json
{
  "inventory": {
    "id": 1,
    "product_id": 100,
    "sku": "PROD-001",
    "quantity": 100,
    "reserved_quantity": 20,
    "warehouse_id": 1,
    "warehouse_name": "主仓库",
    "warehouse_code": "WH001",
    "location": "A-01-001",
    "low_stock_threshold": 10,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "available_quantity": 80,
  "is_low_stock": false
}
```

### 2. 库存调整

#### POST /inventory/adjust

**请求体**
```json
{
  "sku": "PROD-001",
  "quantity": 50,
  "type": "in",
  "warehouse_id": 1,
  "reference_type": "purchase",
  "reference_id": "PO-20240101-001",
  "note": "采购入库",
  "created_by": 1
}
```

**字段说明**
- `sku` (必填) - 商品SKU
- `quantity` (必填) - 数量（必须为非负数）
- `type` (必填) - 操作类型
  - `in` - 入库（增加库存）
  - `out` - 出库（减少库存）
  - `adjust` - 调整（直接设置库存数量）
- `warehouse_id` (可选) - 仓库ID
- `reference_type` (可选) - 关联单据类型：order, purchase, return, adjustment
- `reference_id` (可选) - 关联单据ID
- `note` (可选) - 备注
- `created_by` (可选) - 操作人ID

**响应示例**
```json
{
  "success": true,
  "inventory": {
    "id": 1,
    "sku": "PROD-001",
    "quantity": 150,
    "reserved_quantity": 20
  },
  "transaction": {
    "id": 100,
    "inventory_id": 1,
    "type": "in",
    "quantity": 50,
    "before_quantity": 100,
    "after_quantity": 150,
    "reference_type": "purchase",
    "reference_id": "PO-20240101-001",
    "note": "采购入库",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### 3. 库存预留

#### POST /inventory/reserve

**请求体**
```json
{
  "sku": "PROD-001",
  "quantity": 5,
  "order_id": "ORD-20240101-001",
  "expires_in_minutes": 30
}
```

**字段说明**
- `sku` (必填) - 商品SKU
- `quantity` (必填) - 预留数量（必须为正数）
- `order_id` (必填) - 订单ID
- `expires_in_minutes` (可选) - 过期时间（分钟），默认30分钟

**响应示例**
```json
{
  "success": true,
  "reservation": {
    "id": 1,
    "inventory_id": 1,
    "order_id": "ORD-20240101-001",
    "quantity": 5,
    "status": "reserved",
    "expires_at": "2024-01-01T00:30:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "inventory": {
    "id": 1,
    "sku": "PROD-001",
    "quantity": 150,
    "reserved_quantity": 25
  }
}
```

### 4. 库存释放

#### POST /inventory/release

**请求体**
```json
{
  "order_id": "ORD-20240101-001",
  "sku": "PROD-001"
}
```

**字段说明**
- `order_id` (必填) - 订单ID
- `sku` (可选) - 商品SKU，如果不提供则释放该订单的所有预留

**响应示例**
```json
{
  "success": true,
  "released_count": 1,
  "reservations": [
    {
      "id": 1,
      "inventory_id": 1,
      "order_id": "ORD-20240101-001",
      "quantity": 5,
      "status": "reserved"
    }
  ]
}
```

### 5. 库存变动记录

#### GET /inventory/transactions

**查询参数**
- `sku` (可选) - 按SKU筛选
- `type` (可选) - 按类型筛选：in, out, reserve, release, adjust
- `page` (可选) - 页码，默认1
- `page_size` (可选) - 每页数量，默认20，最大100

**响应示例**
```json
{
  "transactions": [
    {
      "id": 100,
      "inventory_id": 1,
      "type": "in",
      "quantity": 50,
      "before_quantity": 100,
      "after_quantity": 150,
      "reference_type": "purchase",
      "reference_id": "PO-20240101-001",
      "note": "采购入库",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 20
}
```

### 6. 清理过期预留

#### POST /inventory/cleanup-expired

清理所有过期的库存预留记录（通常由定时任务调用）

**响应示例**
```json
{
  "success": true,
  "cleaned_count": 5
}
```

---

## 仓库管理

### 1. 仓库列表

#### GET /warehouses

**查询参数**
- `status` (可选) - 按状态筛选：active, inactive
- `page` (可选) - 页码，默认1
- `page_size` (可选) - 每页数量，默认20，最大100

**响应示例**
```json
{
  "warehouses": [
    {
      "id": 1,
      "name": "主仓库",
      "code": "WH001",
      "address": "北京市朝阳区XXX街道",
      "city": "北京",
      "province": "北京市",
      "country": "CN",
      "postal_code": "100000",
      "contact_name": "张三",
      "contact_phone": "13800138000",
      "status": "active",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 2,
  "page": 1,
  "page_size": 20
}
```

### 2. 创建仓库

#### POST /warehouses

**请求体**
```json
{
  "name": "华南仓",
  "code": "WH003",
  "address": "广东省广州市XXX区XXX街道",
  "city": "广州",
  "province": "广东省",
  "country": "CN",
  "postal_code": "510000",
  "contact_name": "李四",
  "contact_phone": "13900139000"
}
```

**字段说明**
- `name` (必填) - 仓库名称
- `code` (必填) - 仓库代码（唯一）
- `address` (可选) - 地址
- `city` (可选) - 城市
- `province` (可选) - 省份
- `country` (可选) - 国家，默认CN
- `postal_code` (可选) - 邮政编码
- `contact_name` (可选) - 联系人
- `contact_phone` (可选) - 联系电话

**响应示例**
```json
{
  "id": 3,
  "name": "华南仓",
  "code": "WH003",
  "address": "广东省广州市XXX区XXX街道",
  "city": "广州",
  "province": "广东省",
  "country": "CN",
  "postal_code": "510000",
  "contact_name": "李四",
  "contact_phone": "13900139000",
  "status": "active",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### 3. 仓库详情

#### GET /warehouses/:id

**路径参数**
- `id` - 仓库ID

**响应示例**（同创建仓库的响应）

### 4. 更新仓库

#### PUT /warehouses/:id

**路径参数**
- `id` - 仓库ID

**请求体**
```json
{
  "name": "华南仓库（新名称）",
  "contact_name": "王五",
  "contact_phone": "13700137000",
  "status": "inactive"
}
```

**字段说明**
所有字段都是可选的，只更新提供的字段：
- `name` - 仓库名称
- `address` - 地址
- `city` - 城市
- `province` - 省份
- `country` - 国家
- `postal_code` - 邮政编码
- `contact_name` - 联系人
- `contact_phone` - 联系电话
- `status` - 状态：active, inactive

**响应示例**（返回更新后的仓库信息）

### 5. 删除仓库

#### DELETE /warehouses/:id

**路径参数**
- `id` - 仓库ID

**注意**：只能删除没有库存关联的仓库

**响应示例**
```json
{
  "success": true
}
```

### 6. 仓库库存统计

#### GET /warehouses/:id/stats

**路径参数**
- `id` - 仓库ID

**响应示例**
```json
{
  "warehouse": {
    "id": 1,
    "name": "主仓库",
    "code": "WH001"
  },
  "total_items": 150,
  "total_quantity": 5000,
  "total_reserved": 500,
  "low_stock_items": 10
}
```

---

## 错误响应

所有错误响应遵循以下格式：

```json
{
  "error": "错误描述信息"
}
```

### HTTP 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `404` - 资源不存在
- `409` - 冲突（如仓库代码已存在）
- `500` - 服务器错误

---

## 使用示例

### 完整的订单库存流程

1. **创建订单时预留库存**
```bash
curl -X POST https://your-domain.com/inventory/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "quantity": 2,
    "order_id": "ORD-20240101-001",
    "expires_in_minutes": 30
  }'
```

2. **订单支付成功后扣减库存**
```bash
curl -X POST https://your-domain.com/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "quantity": 2,
    "type": "out",
    "reference_type": "order",
    "reference_id": "ORD-20240101-001",
    "note": "订单出库"
  }'
```

3. **同时释放预留**
```bash
curl -X POST https://your-domain.com/inventory/release \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-20240101-001"
  }'
```

4. **订单取消时释放预留**
```bash
curl -X POST https://your-domain.com/inventory/release \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-20240101-001"
  }'
```

### 采购入库流程

```bash
curl -X POST https://your-domain.com/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "quantity": 100,
    "type": "in",
    "warehouse_id": 1,
    "reference_type": "purchase",
    "reference_id": "PO-20240101-001",
    "note": "采购入库100件"
  }'
```

---

## 定时任务建议

建议设置定时任务（Cron Trigger）定期清理过期的预留：

```toml
# wrangler.toml
[triggers]
crons = ["*/5 * * * *"]  # 每5分钟执行一次
```

在代码中处理定时任务：
```typescript
export default {
  async scheduled(event, env, ctx) {
    const service = new InventoryService(env.DB);
    await service.cleanupExpiredReservations();
  }
}
```
