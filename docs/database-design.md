# 数据库设计文档

## 概述

本文档描述 Building Store 微服务系统的数据库设计。遵循微服务架构原则，每个服务拥有独立的数据库实例，实现数据隔离。

## 数据库策略

### 原则

1. **数据库隔离**: 每个服务独立的数据库
2. **数据所有权**: 服务拥有其数据的完全控制权
3. **API访问**: 通过服务API访问数据，不直接访问其他服务的数据库
4. **最终一致性**: 接受短暂的数据不一致，通过事件最终达到一致

### 数据库选型

| 服务 | 数据库类型 | 说明 |
|------|-----------|------|
| User Service | PostgreSQL | 关系型，适合用户数据 |
| Product Service | PostgreSQL + Elasticsearch | 关系型存储 + 全文搜索 |
| Order Service | PostgreSQL | 关系型，保证事务一致性 |
| Inventory Service | PostgreSQL + Redis | 关系型 + 缓存 |
| Payment Service | PostgreSQL | 关系型，金融数据 |
| Auth Service | Redis | KV存储，令牌缓存 |
| Notification Service | MongoDB | 文档型，灵活的消息结构 |

## 用户服务数据库设计

### users 表

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(100),
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT check_status CHECK (status IN ('active', 'inactive', 'suspended')),
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
);
```

### roles 表

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_role_name CHECK (name IN ('admin', 'manager', 'customer', 'guest'))
);
```

### permissions 表

```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_resource_action (resource, action)
);
```

### user_roles 表

```sql
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, role_id)
);
```

### role_permissions 表

```sql
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (role_id, permission_id)
);
```

### addresses 表

```sql
CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    province VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    district VARCHAR(50),
    detail TEXT NOT NULL,
    postal_code VARCHAR(20),
    contact_name VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_default (is_default)
);
```

## 产品服务数据库设计

### products 表

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    brand VARCHAR(100),
    specifications JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    
    CONSTRAINT check_price CHECK (price >= 0),
    CONSTRAINT check_status CHECK (status IN ('active', 'inactive', 'out_of_stock')),
    INDEX idx_category_id (category_id),
    INDEX idx_status (status),
    INDEX idx_name (name),
    INDEX idx_price (price)
);
```

### categories 表

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_parent_id (parent_id),
    INDEX idx_sort_order (sort_order)
);
```

### product_images 表

```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_product_id (product_id)
);
```

## 订单服务数据库设计

### orders 表

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    shipping_address_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_status CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled')),
    CONSTRAINT check_total_amount CHECK (total_amount >= 0),
    INDEX idx_user_id (user_id),
    INDEX idx_order_number (order_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);
```

### order_items 表

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_quantity CHECK (quantity > 0),
    CONSTRAINT check_unit_price CHECK (unit_price >= 0),
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);
```

### order_status_history 表

```sql
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    
    INDEX idx_order_id (order_id),
    INDEX idx_created_at (created_at)
);
```

## 库存服务数据库设计

### inventory 表

```sql
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL,
    available_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    total_quantity INTEGER GENERATED ALWAYS AS (available_quantity + reserved_quantity) STORED,
    warehouse_location VARCHAR(100),
    last_restock_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_available_quantity CHECK (available_quantity >= 0),
    CONSTRAINT check_reserved_quantity CHECK (reserved_quantity >= 0),
    INDEX idx_product_id (product_id)
);
```

### inventory_transactions 表

```sql
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reference_id UUID,
    reference_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_transaction_type CHECK (transaction_type IN ('restock', 'reserve', 'release', 'consume', 'adjust')),
    INDEX idx_product_id (product_id),
    INDEX idx_reference (reference_id, reference_type),
    INDEX idx_created_at (created_at)
);
```

## 支付服务数据库设计

### payments 表

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID NOT NULL,
    user_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    payment_gateway VARCHAR(50),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    CONSTRAINT check_amount CHECK (amount > 0),
    INDEX idx_order_id (order_id),
    INDEX idx_user_id (user_id),
    INDEX idx_payment_number (payment_number),
    INDEX idx_status (status)
);
```

### refunds 表

```sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    refund_number VARCHAR(50) UNIQUE NOT NULL,
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT check_amount CHECK (amount > 0),
    INDEX idx_payment_id (payment_id),
    INDEX idx_status (status)
);
```

## 通知服务数据库设计 (MongoDB)

### notifications 集合

```javascript
{
  _id: ObjectId,
  userId: "UUID",
  type: "email" | "sms" | "push" | "in_app",
  subject: "string",
  content: "string",
  status: "pending" | "sent" | "failed" | "read",
  metadata: {
    // 灵活的元数据
    orderId: "UUID",
    channel: "string",
    ...
  },
  sentAt: Date,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// 索引
db.notifications.createIndex({ userId: 1, createdAt: -1 })
db.notifications.createIndex({ status: 1, createdAt: 1 })
db.notifications.createIndex({ type: 1 })
```

## 数据关系图

```
用户服务:
  users 1--* user_roles *--1 roles 1--* role_permissions *--1 permissions
  users 1--* addresses

产品服务:
  categories 1--* categories (自关联)
  categories 1--* products 1--* product_images

订单服务:
  orders 1--* order_items
  orders 1--* order_status_history

库存服务:
  inventory 1--* inventory_transactions

支付服务:
  payments 1--* refunds
```

## 跨服务数据访问

### 原则
- 不允许直接跨数据库访问
- 通过服务API获取数据
- 使用事件同步数据

### 示例：订单创建流程

```
1. Order Service创建订单（写入orders表）
2. 发布 order.created 事件
3. Inventory Service订阅事件，预留库存
4. Payment Service订阅事件，等待支付
5. Notification Service订阅事件，发送通知
```

## 数据一致性保证

### Saga模式实现

```sql
-- 订单服务补偿表
CREATE TABLE saga_transactions (
    id UUID PRIMARY KEY,
    saga_id UUID NOT NULL,
    step VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_saga_id (saga_id)
);
```

## 数据迁移管理

使用版本化的迁移脚本：

```
migrations/
  V1__initial_schema.sql
  V2__add_user_status.sql
  V3__add_product_specifications.sql
```

工具推荐：
- Node.js: node-pg-migrate, Knex.js
- Java: Flyway, Liquibase
- Go: golang-migrate

## 数据备份策略

1. **全量备份**: 每日全量备份
2. **增量备份**: 每小时增量备份
3. **WAL归档**: 实时WAL日志归档
4. **跨区域备份**: 备份存储在不同区域

## 性能优化

### 索引策略
- 为频繁查询的列创建索引
- 复合索引用于多条件查询
- 避免过多索引影响写入性能

### 分区策略
```sql
-- 订单表按月分区
CREATE TABLE orders (
    ...
) PARTITION BY RANGE (created_at);

CREATE TABLE orders_2026_01 PARTITION OF orders
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 读写分离
- 主库处理写操作
- 从库处理读操作
- 使用连接池管理

## 监控指标

- 连接数
- 查询性能（慢查询）
- 缓存命中率
- 磁盘使用率
- 锁等待
- 死锁

## 总结

本数据库设计遵循微服务架构的数据隔离原则，每个服务拥有独立的数据库，通过API和事件进行数据交互，实现了系统的解耦和可扩展性。
