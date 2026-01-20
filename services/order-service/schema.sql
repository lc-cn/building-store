-- 订单服务数据库表结构

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, processing, shipped, delivered, cancelled, refunded
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- unpaid, paid, refunded, partially_refunded
  shipping_status VARCHAR(20) DEFAULT 'unshipped', -- unshipped, shipped, in_transit, delivered
  
  -- 价格信息
  subtotal DECIMAL(10, 2) NOT NULL, -- 小计
  shipping_fee DECIMAL(10, 2) DEFAULT 0, -- 运费
  tax DECIMAL(10, 2) DEFAULT 0, -- 税费
  discount DECIMAL(10, 2) DEFAULT 0, -- 折扣
  total DECIMAL(10, 2) NOT NULL, -- 总计
  
  -- 收货地址
  shipping_name VARCHAR(100),
  shipping_phone VARCHAR(20),
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  shipping_province VARCHAR(100),
  shipping_country VARCHAR(100) DEFAULT 'CN',
  shipping_postal_code VARCHAR(20),
  
  -- 其他信息
  notes TEXT, -- 订单备注
  customer_note TEXT, -- 客户留言
  tracking_number VARCHAR(100), -- 物流单号
  tracking_company VARCHAR(100), -- 物流公司
  
  cancelled_at DATETIME,
  confirmed_at DATETIME,
  paid_at DATETIME,
  shipped_at DATETIME,
  delivered_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_variant_id INTEGER, -- 如果是变体商品
  sku VARCHAR(100) NOT NULL,
  name VARCHAR(200) NOT NULL,
  image_url VARCHAR(500),
  price DECIMAL(10, 2) NOT NULL, -- 单价
  quantity INTEGER NOT NULL, -- 数量
  subtotal DECIMAL(10, 2) NOT NULL, -- 小计 = price * quantity
  attributes TEXT, -- JSON 商品属性 {color: 'red', size: 'L'}
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 订单状态历史表
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  note TEXT,
  created_by INTEGER, -- 操作人 user_id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
