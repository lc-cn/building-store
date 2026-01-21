# Inventory Service 使用示例

本文档提供了 inventory-service 的实际使用示例。

## 前置准备

确保服务已启动：
```bash
cd services/inventory-service
npm run dev
```

## 1. 仓库管理示例

### 创建仓库
```bash
curl -X POST http://localhost:8787/warehouses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "北京仓库",
    "code": "BJ001",
    "address": "北京市朝阳区建国路100号",
    "city": "北京",
    "province": "北京市",
    "contact_name": "张三",
    "contact_phone": "13800138000"
  }'
```

### 查询仓库列表
```bash
curl http://localhost:8787/warehouses
```

### 查询仓库详情
```bash
curl http://localhost:8787/warehouses/1
```

### 查询仓库库存统计
```bash
curl http://localhost:8787/warehouses/1/stats
```

## 2. 库存管理示例

### 采购入库流程

```bash
# 1. 采购入库 - 新增100件商品
curl -X POST http://localhost:8787/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "quantity": 100,
    "type": "in",
    "warehouse_id": 1,
    "reference_type": "purchase",
    "reference_id": "PO-20240101-001",
    "note": "采购100台iPhone 15"
  }'
```

### 查询库存
```bash
curl http://localhost:8787/inventory/PHONE-001
```

响应示例：
```json
{
  "inventory": {
    "id": 1,
    "sku": "PHONE-001",
    "quantity": 100,
    "reserved_quantity": 0,
    "warehouse_id": 1,
    "warehouse_name": "北京仓库",
    "low_stock_threshold": 10
  },
  "available_quantity": 100,
  "is_low_stock": false
}
```

## 3. 订单库存预留流程

### 步骤1：创建订单时预留库存
```bash
curl -X POST http://localhost:8787/inventory/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "quantity": 2,
    "order_id": "ORD-20240101-001",
    "expires_in_minutes": 30
  }'
```

响应示例：
```json
{
  "success": true,
  "reservation": {
    "id": 1,
    "order_id": "ORD-20240101-001",
    "quantity": 2,
    "status": "reserved",
    "expires_at": "2024-01-01T12:30:00Z"
  },
  "inventory": {
    "quantity": 100,
    "reserved_quantity": 2
  }
}
```

### 步骤2a：订单支付成功 - 扣减库存
```bash
# 扣减库存
curl -X POST http://localhost:8787/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "quantity": 2,
    "type": "out",
    "reference_type": "order",
    "reference_id": "ORD-20240101-001",
    "note": "订单出库"
  }'

# 释放预留
curl -X POST http://localhost:8787/inventory/release \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-20240101-001"
  }'
```

### 步骤2b：订单取消 - 释放预留
```bash
curl -X POST http://localhost:8787/inventory/release \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-20240101-001"
  }'
```

## 4. 库存调整场景

### 盘点调整
```bash
# 盘点发现实际库存是95件，需要调整
curl -X POST http://localhost:8787/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "quantity": 95,
    "type": "adjust",
    "reference_type": "adjustment",
    "reference_id": "ADJ-20240101-001",
    "note": "库存盘点调整"
  }'
```

### 退货入库
```bash
curl -X POST http://localhost:8787/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "quantity": 1,
    "type": "in",
    "reference_type": "return",
    "reference_id": "RET-20240101-001",
    "note": "客户退货"
  }'
```

## 5. 查询库存变动记录

### 查询所有变动
```bash
curl "http://localhost:8787/inventory/transactions?page=1&page_size=20"
```

### 查询特定SKU的变动
```bash
curl "http://localhost:8787/inventory/transactions?sku=PHONE-001"
```

### 查询特定类型的变动
```bash
curl "http://localhost:8787/inventory/transactions?type=in"
```

### 组合查询
```bash
curl "http://localhost:8787/inventory/transactions?sku=PHONE-001&type=out&page=1&page_size=10"
```

## 6. 清理过期预留

```bash
# 手动触发清理过期预留
curl -X POST http://localhost:8787/inventory/cleanup-expired
```

响应示例：
```json
{
  "success": true,
  "cleaned_count": 5
}
```

## 7. 完整业务流程示例

### 电商订单完整流程

```bash
# 1. 创建订单，预留库存
ORDER_ID="ORD-$(date +%Y%m%d-%H%M%S)"
echo "订单ID: $ORDER_ID"

curl -X POST http://localhost:8787/inventory/reserve \
  -H "Content-Type: application/json" \
  -d "{
    \"sku\": \"PHONE-001\",
    \"quantity\": 1,
    \"order_id\": \"$ORDER_ID\",
    \"expires_in_minutes\": 30
  }"

# 2. 等待用户支付...（30分钟内）

# 3. 支付成功，扣减库存
curl -X POST http://localhost:8787/inventory/adjust \
  -H "Content-Type: application/json" \
  -d "{
    \"sku\": \"PHONE-001\",
    \"quantity\": 1,
    \"type\": \"out\",
    \"reference_type\": \"order\",
    \"reference_id\": \"$ORDER_ID\",
    \"note\": \"订单发货\"
  }"

# 4. 释放预留
curl -X POST http://localhost:8787/inventory/release \
  -H "Content-Type: application/json" \
  -d "{
    \"order_id\": \"$ORDER_ID\"
  }"

# 5. 查询最终库存
curl http://localhost:8787/inventory/PHONE-001
```

## 8. 多仓库场景

```bash
# 创建第二个仓库
curl -X POST http://localhost:8787/warehouses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "上海仓库",
    "code": "SH001",
    "city": "上海",
    "province": "上海市"
  }'

# 向上海仓库入库
curl -X POST http://localhost:8787/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-002",
    "quantity": 50,
    "type": "in",
    "warehouse_id": 2,
    "reference_type": "purchase",
    "reference_id": "PO-20240101-002"
  }'

# 查询上海仓库统计
curl http://localhost:8787/warehouses/2/stats
```

## 9. 错误处理示例

### 库存不足
```bash
curl -X POST http://localhost:8787/inventory/adjust \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "quantity": 1000,
    "type": "out"
  }'

# 响应: {"error": "Insufficient inventory"}
```

### 预留超出可用库存
```bash
curl -X POST http://localhost:8787/inventory/reserve \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PHONE-001",
    "quantity": 1000,
    "order_id": "ORD-XXX"
  }'

# 响应: {"error": "Insufficient inventory. Available: 98, Required: 1000"}
```

### SKU不存在
```bash
curl http://localhost:8787/inventory/NONEXISTENT-SKU

# 响应: {"error": "Inventory not found"}
```

## 10. 性能测试

### 批量预留测试
```bash
# 并发预留测试
for i in {1..10}; do
  curl -X POST http://localhost:8787/inventory/reserve \
    -H "Content-Type: application/json" \
    -d "{
      \"sku\": \"PHONE-001\",
      \"quantity\": 1,
      \"order_id\": \"ORD-TEST-$i\"
    }" &
done
wait

# 查询库存状态
curl http://localhost:8787/inventory/PHONE-001
```

## 注意事项

1. **预留超时**：预留的库存会在设定时间后自动过期，建议设置合理的过期时间
2. **并发控制**：库存操作是事务性的，但在高并发场景下仍需要在应用层做好处理
3. **库存安全**：建议设置低库存警戒线，避免超卖
4. **日志记录**：所有库存变动都会记录在 `inventory_transactions` 表中，可用于审计

## 数据库查询

如果需要直接查询数据库：

```bash
# 查询所有库存
wrangler d1 execute building-store-inventory \
  --command="SELECT * FROM inventory"

# 查询所有预留
wrangler d1 execute building-store-inventory \
  --command="SELECT * FROM inventory_reservations WHERE status='reserved'"

# 查询变动记录
wrangler d1 execute building-store-inventory \
  --command="SELECT * FROM inventory_transactions ORDER BY created_at DESC LIMIT 10"
```
